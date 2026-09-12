/**
 * admin.test.js — Admin API authorization and functionality tests.
 *
 * Tests:
 * - Admin-only route protection (CUSTOMER and FLEET_OWNER cannot access)
 * - Admin can access platform analytics
 * - Admin can view all users
 * - Admin can suspend/restore users
 * - Admin can view all vehicles and moderate them
 * - Malformed IDs are handled safely
 */

import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Vehicle from "../src/models/Vehicle.js";
import { connectForTests, disconnectAfterTests } from "./testDb.js";

let adminToken;
let customerToken;
let ownerToken;
let testCustomerId;
let testVehicleId;

beforeAll(async () => {
  await connectForTests();
  await User.deleteMany({ email: /@admintest\.com$/ });
  await Vehicle.deleteMany({ name: "__AdminTestVehicle__" });

  // Register all 3 roles
  await Promise.all([
    request(app).post("/api/auth/register").send({
      name: "Admin User", email: "admin@admintest.com", password: "password123", role: "ADMIN",
    }),
    request(app).post("/api/auth/register").send({
      name: "Customer User", email: "customer@admintest.com", password: "password123", role: "CUSTOMER",
    }),
    request(app).post("/api/auth/register").send({
      name: "Owner User", email: "owner@admintest.com", password: "password123", role: "FLEET_OWNER",
    }),
  ]);

  const [adminLogin, custLogin, ownerLogin] = await Promise.all([
    request(app).post("/api/auth/login").send({ email: "admin@admintest.com", password: "password123" }),
    request(app).post("/api/auth/login").send({ email: "customer@admintest.com", password: "password123" }),
    request(app).post("/api/auth/login").send({ email: "owner@admintest.com", password: "password123" }),
  ]);

  adminToken = adminLogin.body.token;
  customerToken = custLogin.body.token;
  ownerToken = ownerLogin.body.token;

  const cust = await User.findOne({ email: "customer@admintest.com" });
  testCustomerId = cust._id.toString();

  const owner = await User.findOne({ email: "owner@admintest.com" });
  const vehicle = await Vehicle.create({
    owner: owner._id,
    name: "__AdminTestVehicle__",
    brand: "TestBrand", model: "TestModel", year: 2023, type: "car",
    description: "Admin test vehicle for automated testing purposes. Do not book.",
    pricePerDay: 1000, securityDeposit: 1000,
    fuelType: "petrol", transmission: "manual", seats: 5,
    location: "Test City", city: "TestCity",
    isAvailable: true, listingStatus: "active",
  });
  testVehicleId = vehicle._id.toString();
});

afterAll(async () => {
  await User.deleteMany({ email: /@admintest\.com$/ });
  await Vehicle.deleteMany({ name: "__AdminTestVehicle__" });
  await disconnectAfterTests();
});

// ─── RBAC: Non-admins cannot access admin endpoints ─────────────────────────

describe("Admin RBAC — Non-admin cannot access admin routes", () => {
  test("CUSTOMER cannot access analytics", async () => {
    const res = await request(app).get("/api/admin/analytics").set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("FLEET_OWNER cannot access analytics", async () => {
    const res = await request(app).get("/api/admin/analytics").set("Authorization", `Bearer ${ownerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("Unauthenticated cannot access analytics", async () => {
    const res = await request(app).get("/api/admin/analytics");
    expect(res.statusCode).toBe(401);
  });

  test("CUSTOMER cannot list users", async () => {
    const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("FLEET_OWNER cannot list users", async () => {
    const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${ownerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("CUSTOMER cannot list vehicles (admin endpoint)", async () => {
    const res = await request(app).get("/api/admin/vehicles").set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("CUSTOMER cannot list bookings (admin endpoint)", async () => {
    const res = await request(app).get("/api/admin/bookings").set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("CUSTOMER cannot list payments (admin endpoint)", async () => {
    const res = await request(app).get("/api/admin/payments").set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ─── Admin Analytics ─────────────────────────────────────────────────────────

describe("Admin Analytics", () => {
  test("Admin gets platform analytics with correct shape", async () => {
    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analytics).toBeDefined();
    expect(res.body.analytics.users).toBeDefined();
    expect(res.body.analytics.vehicles).toBeDefined();
    expect(res.body.analytics.bookings).toBeDefined();
    expect(res.body.analytics.revenue).toBeDefined();
    expect(typeof res.body.analytics.users.total).toBe("number");
    expect(typeof res.body.analytics.revenue.total).toBe("number");
  });
});

// ─── Admin User Management ───────────────────────────────────────────────────

describe("Admin User Management", () => {
  test("Admin can list all users (paginated)", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(typeof res.body.pagination.total).toBe("number");
    // Passwords must never be in the response
    for (const u of res.body.users) {
      expect(u.password).toBeUndefined();
    }
  });

  test("Admin can filter users by role", async () => {
    const res = await request(app)
      .get("/api/admin/users?role=CUSTOMER")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    for (const u of res.body.users) {
      expect(u.role).toBe("CUSTOMER");
    }
  });

  test("Admin can view a specific user by ID", async () => {
    const res = await request(app)
      .get(`/api/admin/users/${testCustomerId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user._id).toBe(testCustomerId);
    expect(res.body.user.password).toBeUndefined(); // no password leak
  });

  test("Admin can suspend a user", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${testCustomerId}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ suspend: true, reason: "Test suspension" });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.isSuspended).toBe(true);
  });

  test("Admin can restore a suspended user", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${testCustomerId}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ suspend: false, reason: "Restored after review" });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.isSuspended).toBe(false);
  });

  test("Missing 'suspend' boolean returns 400", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${testCustomerId}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "No suspend field" });
    expect(res.statusCode).toBe(400);
  });

  test("Invalid user ID returns 404 or 400", async () => {
    const res = await request(app)
      .get("/api/admin/users/notavalidid")
      .set("Authorization", `Bearer ${adminToken}`);
    expect([400, 404]).toContain(res.statusCode);
  });
});

// ─── Admin Vehicle Moderation ─────────────────────────────────────────────────

describe("Admin Vehicle Moderation", () => {
  test("Admin can list all vehicles", async () => {
    const res = await request(app)
      .get("/api/admin/vehicles")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.vehicles)).toBe(true);
  });

  test("Admin can deactivate a vehicle listing", async () => {
    const res = await request(app)
      .patch(`/api/admin/vehicles/${testVehicleId}/moderate`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ listingStatus: "deactivated", reason: "Policy violation test" });
    expect(res.statusCode).toBe(200);
    expect(res.body.vehicle.listingStatus).toBe("deactivated");
  });

  test("Admin can reactivate a deactivated vehicle", async () => {
    const res = await request(app)
      .patch(`/api/admin/vehicles/${testVehicleId}/moderate`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ listingStatus: "active" });
    expect(res.statusCode).toBe(200);
    expect(res.body.vehicle.listingStatus).toBe("active");
  });

  test("Invalid listingStatus value returns 400", async () => {
    const res = await request(app)
      .patch(`/api/admin/vehicles/${testVehicleId}/moderate`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ listingStatus: "hacked_status" });
    expect(res.statusCode).toBe(400);
  });
});

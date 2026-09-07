/**
 * AUTH TESTS — Registration, Login, JWT, RBAC
 *
 * Uses in-memory MongoDB (mongodb-memory-server) via global setup.
 * Tests import app.js (pure Express) — no connectDB(), no process.exit().
 */

import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { connectForTests, disconnectAfterTests } from "./testDb.js";

beforeAll(async () => {
  await connectForTests();
  await User.deleteMany({ email: /@authtest\.com$/ });
});

afterAll(async () => {
  await User.deleteMany({ email: /@authtest\.com$/ });
  await disconnectAfterTests();
});


// ─── Registration ─────────────────────────────────────────────────────────────

describe("Registration", () => {
  test("Registers a CUSTOMER successfully", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Auth Customer",
      email: "customer@authtest.com",
      password: "password123",
      role: "CUSTOMER",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe("customer@authtest.com");
    expect(res.body.user.password).toBeUndefined(); // NEVER return password
  });

  test("Registers a FLEET_OWNER successfully", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Auth Owner",
      email: "owner@authtest.com",
      password: "password123",
      role: "FLEET_OWNER",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.user.role).toBe("FLEET_OWNER");
  });

  test("Rejects duplicate email with 400", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Dup User",
      email: "dup@authtest.com",
      password: "password123",
    });
    const res = await request(app).post("/api/auth/register").send({
      name: "Dup User 2",
      email: "dup@authtest.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("Rejects missing required fields", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "nopw@authtest.com" });
    expect(res.statusCode).toBe(400);
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe("Login", () => {
  test("Login with correct credentials returns JWT token", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "customer@authtest.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.split(".").length).toBe(3); // JWT has 3 parts
    expect(res.body.user.password).toBeUndefined();   // Never return password
  });

  test("Wrong password returns 401 — same message prevents user enumeration", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "customer@authtest.com",
      password: "WRONG_PASSWORD",
    });
    expect(res.statusCode).toBe(401);
  });

  test("Non-existent email returns 401 — same error message as wrong password", async () => {
    const resWrongUser = await request(app).post("/api/auth/login").send({
      email: "nobody@authtest.com",
      password: "password123",
    });
    const resWrongPass = await request(app).post("/api/auth/login").send({
      email: "customer@authtest.com",
      password: "WRONG",
    });
    // Both should return 401 with the same generic message (user enumeration prevention)
    expect(resWrongUser.statusCode).toBe(401);
    expect(resWrongPass.statusCode).toBe(401);
    expect(resWrongUser.body.error?.message).toBe(resWrongPass.body.error?.message);
  });
});

// ─── Protected Routes / RBAC ──────────────────────────────────────────────────

describe("JWT & RBAC", () => {
  let customerToken;
  let ownerToken;

  beforeAll(async () => {
    const [c, o] = await Promise.all([
      request(app).post("/api/auth/login").send({ email: "customer@authtest.com", password: "password123" }),
      request(app).post("/api/auth/login").send({ email: "owner@authtest.com", password: "password123" }),
    ]);
    customerToken = c.body.token;
    ownerToken = o.body.token;
  });

  test("GET /api/auth/me returns own user when authenticated", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe("customer@authtest.com");
    expect(res.body.user.password).toBeUndefined();
  });

  test("GET /api/auth/me returns 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });

  test("GET /api/auth/me returns 401 with malformed JWT", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer not.a.jwt.token");
    expect(res.statusCode).toBe(401);
  });

  test("RBAC: CUSTOMER cannot access fleet-owner-only dashboard", async () => {
    const res = await request(app).get("/api/dashboard/stats").set("Authorization", `Bearer ${customerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("RBAC: FLEET_OWNER can access dashboard (gets 200 or data error, never 401/403)", async () => {
    const res = await request(app).get("/api/dashboard/stats").set("Authorization", `Bearer ${ownerToken}`);
    // Dashboard may return 200 with data, or 500 if aggregation fails in test DB
    // It must NOT return 401 (unauthenticated) or 403 (unauthorized)
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).not.toBe(403);
  });


  test("RBAC: CUSTOMER cannot POST /api/vehicles (fleet-owner only)", async () => {
    const res = await request(app).post("/api/vehicles").set("Authorization", `Bearer ${customerToken}`).send({
      name: "Test", brand: "Brand", type: "car", pricePerDay: 1000,
    });
    expect(res.statusCode).toBe(403);
  });
});

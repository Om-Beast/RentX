/**
 * seed.js — Realistic seed data for RentX.
 *
 * Creates:
 * - 3 users: customer, fleet owner, admin
 * - 12 vehicles across all types (bike, scooter, car, suv, sedan, hatchback, luxury, ev)
 * - Vehicles span 5 cities: Mumbai, Delhi, Bangalore, Pune, Hyderabad
 *
 * Run: node scripts/seed.js
 *
 * Default credentials:
 *   customer@rentx.com  / password123 (CUSTOMER)
 *   owner@rentx.com     / password123 (FLEET_OWNER)
 *   admin@rentx.com     / password123 (ADMIN)
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// --- Models (inline schemas to avoid circular import issues) ---
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: { type: String, enum: ["CUSTOMER", "FLEET_OWNER", "ADMIN"], default: "CUSTOMER" },
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    trustScore: { type: Number, default: 500 },
    phone: { type: String, default: null },
    profileImage: { type: String, default: null },
  },
  { timestamps: true }
);

const vehicleSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    brand: String,
    model: String,
    year: Number,
    type: String,
    description: String,
    pricePerDay: Number,
    securityDeposit: { type: Number, default: 1000 },
    fuelType: { type: String, default: "petrol" },
    transmission: { type: String, default: "manual" },
    seats: Number,
    features: [String],
    location: String,
    city: String,
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    images: [String],
    isAvailable: { type: Boolean, default: true },
    listingStatus: { type: String, default: "active" },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    rules: { type: String, default: "" },
  },
  { timestamps: true }
);

// Use existing models or create them
const User = mongoose.models.User || mongoose.model("User", userSchema);
const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not set in .env");
  process.exit(1);
}

async function seed() {
  console.log("🌱 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected.");

  // --- Clear existing data ---
  await User.deleteMany({});
  await Vehicle.deleteMany({});
  console.log("🗑️  Cleared existing users and vehicles.");

  // --- Create Users ---
  const HASH_ROUNDS = 12;
  const password = await bcrypt.hash("password123", HASH_ROUNDS);

  const [customer, owner, admin] = await User.insertMany([
    {
      name: "Aryan Mehta",
      email: "customer@rentx.com",
      password,
      role: "CUSTOMER",
      isVerified: true,
      trustScore: 720,
      phone: "+91 9876543210",
    },
    {
      name: "Priya Sharma",
      email: "owner@rentx.com",
      password,
      role: "FLEET_OWNER",
      isVerified: true,
      trustScore: 850,
      phone: "+91 9988776655",
    },
    {
      name: "Admin RentX",
      email: "admin@rentx.com",
      password,
      role: "ADMIN",
      isVerified: true,
      trustScore: 1000,
      phone: "+91 9000000000",
    },
  ]);
  console.log(`👤 Created 3 users: ${customer.email}, ${owner.email}, ${admin.email}`);

  // --- Vehicle seed data ---
  // Unsplash stable image URLs (append ?w=800&q=80 for optimization)
  const vehicles = [
    {
      name: "Activa 6G",
      brand: "Honda",
      model: "Activa 6G OBD2",
      year: 2023,
      type: "scooter",
      description: "Honda Activa 6G — India's most popular scooter. OBD2 compliant, silent start, excellent mileage. Perfect for city commutes. Helmet included.",
      pricePerDay: 350,
      securityDeposit: 500,
      fuelType: "petrol",
      transmission: "automatic",
      seats: 2,
      features: ["Helmet Included", "USB Charging", "First Aid Kit"],
      location: "Andheri West, near Metro Gate 4",
      city: "Mumbai",
      images: [
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80",
        "https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800&q=80",
      ],
      rating: 4.6,
      reviewCount: 38,
      rules: "Valid driving license required. Return with full fuel tank.",
    },
    {
      name: "iQube Electric",
      brand: "TVS",
      model: "iQube S",
      year: 2023,
      type: "ev",
      description: "TVS iQube S — premium electric scooter with 100+ km range per charge. Zero emissions, low running cost, built-in navigation. Great for eco-conscious riders.",
      pricePerDay: 599,
      securityDeposit: 1000,
      fuelType: "electric",
      transmission: "automatic",
      seats: 2,
      features: ["Bluetooth", "GPS", "USB Charging", "Keyless Entry"],
      location: "Koramangala 5th Block",
      city: "Bangalore",
      images: [
        "https://images.unsplash.com/photo-1611674979045-ef7f64c0e2c1?w=800&q=80",
        "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&q=80",
      ],
      rating: 4.8,
      reviewCount: 21,
      rules: "Return with min 20% charge. No highway riding.",
    },
    {
      name: "Classic 350",
      brand: "Royal Enfield",
      model: "Classic 350 Signals",
      year: 2022,
      type: "bike",
      description: "Royal Enfield Classic 350 — iconic retro-styled cruiser. Perfect for weekend getaways and highway rides. Thumping 349cc engine, comfortable ergonomics, timeless looks.",
      pricePerDay: 799,
      securityDeposit: 2000,
      fuelType: "petrol",
      transmission: "manual",
      seats: 2,
      features: ["Helmet Included", "First Aid Kit"],
      location: "Baner Road, Balewadi",
      city: "Pune",
      images: [
        "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&q=80",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      ],
      rating: 4.9,
      reviewCount: 54,
      rules: "Valid heavy license required. Helmet mandatory. No pillion on ghat roads.",
    },
    {
      name: "Nexon XZ+",
      brand: "Tata",
      model: "Nexon XZ+ TurboMax",
      year: 2023,
      type: "hatchback",
      description: "Tata Nexon XZ+ — compact SUV packed with features. Panoramic sunroof, 6 airbags, connected car tech, peppy 1.2L turbo petrol. Rated 5-star NCAP safety.",
      pricePerDay: 1299,
      securityDeposit: 3000,
      fuelType: "petrol",
      transmission: "automatic",
      seats: 5,
      features: ["AC", "Sunroof", "Bluetooth", "USB Charging", "Reverse Camera", "GPS"],
      location: "Hitech City, Madhapur",
      city: "Hyderabad",
      images: [
        "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80",
        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
      ],
      rating: 4.7,
      reviewCount: 33,
      rules: "Minimum 23 years age. No smoking. Pet friendly on request.",
    },
    {
      name: "City 5th Gen",
      brand: "Honda",
      model: "City ZX CVT",
      year: 2022,
      type: "sedan",
      description: "Honda City ZX — premium sedan with lane-watch camera, sunroof, wireless charging. CVT automatic for effortless city driving and highway cruising. Excellent cabin refinement.",
      pricePerDay: 1499,
      securityDeposit: 3000,
      fuelType: "petrol",
      transmission: "automatic",
      seats: 5,
      features: ["AC", "Sunroof", "Bluetooth", "USB Charging", "Reverse Camera", "Cruise Control", "Keyless Entry"],
      location: "Connaught Place, Central Delhi",
      city: "Delhi",
      images: [
        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
      ],
      rating: 4.8,
      reviewCount: 47,
      rules: "No outstation without prior notice. Return clean.",
    },
    {
      name: "Creta SX(O)",
      brand: "Hyundai",
      model: "Creta SX(O) 1.5 Turbo",
      year: 2023,
      type: "suv",
      description: "Hyundai Creta SX(O) — top-end SUV with 10.25\" dual screen, ventilated seats, BOSE sound system, and ADAS safety features. The most sought-after mid-size SUV in India.",
      pricePerDay: 1799,
      securityDeposit: 4000,
      fuelType: "petrol",
      transmission: "automatic",
      seats: 5,
      features: ["AC", "Sunroof", "Bluetooth", "USB Charging", "Reverse Camera", "GPS", "Keyless Entry", "Cruise Control"],
      location: "Bandra Kurla Complex",
      city: "Mumbai",
      images: [
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
      ],
      rating: 4.9,
      reviewCount: 68,
      rules: "Min 25 years. Valid DL mandatory. Outstation allowed with ₹500 extra/day.",
    },
    {
      name: "Thar 4x4",
      brand: "Mahindra",
      model: "Thar LX Diesel AT",
      year: 2022,
      type: "suv",
      description: "Mahindra Thar LX 4x4 — the legendary off-roader. Convertible hardtop, 4WD with low ratio, 18-inch alloys, touch-screen infotainment. Built for adventure.",
      pricePerDay: 2199,
      securityDeposit: 5000,
      fuelType: "diesel",
      transmission: "automatic",
      seats: 4,
      features: ["AC", "Bluetooth", "USB Charging", "GPS", "4WD"],
      location: "Wakad, near Hinjewadi IT Park",
      city: "Pune",
      images: [
        "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
        "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80",
      ],
      rating: 4.9,
      reviewCount: 29,
      rules: "4WD experience preferred. No sand dunes without guide. Helmet not required.",
    },
    {
      name: "Innova Crysta",
      brand: "Toyota",
      model: "Innova Crysta GX MT",
      year: 2021,
      type: "car",
      description: "Toyota Innova Crysta GX — India's most trusted family MPV. Spacious 7-seater, diesel torque for long trips, premium cabin with individual captain seats. Ideal for family outings.",
      pricePerDay: 1999,
      securityDeposit: 4000,
      fuelType: "diesel",
      transmission: "manual",
      seats: 7,
      features: ["AC", "Bluetooth", "USB Charging", "Reverse Camera"],
      location: "Madhapur, HITEC City",
      city: "Hyderabad",
      images: [
        "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
      ],
      rating: 4.7,
      reviewCount: 41,
      rules: "Only for 7 persons. Driver must carry 3 years license. Outstation allowed.",
    },
    {
      name: "Scorpio-N Z8 L",
      brand: "Mahindra",
      model: "Scorpio-N Z8 L MT",
      year: 2023,
      type: "suv",
      description: "Mahindra Scorpio-N Z8 L — reborn legend. Massive 2.2L mHawk diesel, AWD on demand, Meridian sound system, Sony 12\" touchscreen. The most powerful SUV in its class.",
      pricePerDay: 2499,
      securityDeposit: 5000,
      fuelType: "diesel",
      transmission: "manual",
      seats: 7,
      features: ["AC", "Sunroof", "Bluetooth", "USB Charging", "Reverse Camera", "GPS", "Cruise Control"],
      location: "Dwarka Sector 10",
      city: "Delhi",
      images: [
        "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80",
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
      ],
      rating: 4.8,
      reviewCount: 22,
      rules: "Min 25 years. Outstation needs 24h advance notice. No alcohol.",
    },
    {
      name: "Nexon EV Prime",
      brand: "Tata",
      model: "Nexon EV Prime Long Range",
      year: 2023,
      type: "ev",
      description: "Tata Nexon EV Prime — India's best-selling electric SUV. 312 km real-world range, connected ZConnect app, regenerative braking. Smooth and silent with zero running cost.",
      pricePerDay: 1599,
      securityDeposit: 3500,
      fuelType: "electric",
      transmission: "automatic",
      seats: 5,
      features: ["AC", "Sunroof", "Bluetooth", "USB Charging", "Reverse Camera", "GPS", "Keyless Entry"],
      location: "Indiranagar 100 Feet Road",
      city: "Bangalore",
      images: [
        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80",
        "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&q=80",
      ],
      rating: 4.8,
      reviewCount: 35,
      rules: "Return with min 20% charge. Free charging at Tata Power stations.",
    },
    {
      name: "BMW 3 Series",
      brand: "BMW",
      model: "3 Series 330i Sport",
      year: 2022,
      type: "luxury",
      description: "BMW 3 Series 330i Sport — the ultimate driving machine. Twin-scroll turbo, sport-tuned suspension, M Sport body kit, Harman Kardon audio. For those who demand perfection.",
      pricePerDay: 4999,
      securityDeposit: 15000,
      fuelType: "petrol",
      transmission: "automatic",
      seats: 5,
      features: ["AC", "Sunroof", "Bluetooth", "USB Charging", "Reverse Camera", "GPS", "Keyless Entry", "Cruise Control"],
      location: "Worli Sea Face",
      city: "Mumbai",
      images: [
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
      ],
      rating: 4.9,
      reviewCount: 14,
      rules: "Min 28 years. International DL accepted. No off-road. CCTV monitored.",
    },
    {
      name: "WagonR VXI+",
      brand: "Maruti Suzuki",
      model: "WagonR VXI+ 1.2 AGS",
      year: 2022,
      type: "hatchback",
      description: "Maruti WagonR VXI+ — India's most practical city car. Tall-boy design, excellent cabin space, AGS automatic, best-in-class fuel economy. Perfect for first-time renters.",
      pricePerDay: 799,
      securityDeposit: 1500,
      fuelType: "petrol",
      transmission: "automatic",
      seats: 5,
      features: ["AC", "Bluetooth", "USB Charging", "Reverse Camera"],
      location: "Gachibowli, Financial District",
      city: "Hyderabad",
      images: [
        "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80",
        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
      ],
      rating: 4.4,
      reviewCount: 52,
      rules: "Beginner-friendly. AC compulsory charge applies in summer.",
    },
  ];

  const vehicleDocuments = vehicles.map(v => ({ ...v, owner: owner._id }));
  const inserted = await Vehicle.insertMany(vehicleDocuments);
  console.log(`🚗 Created ${inserted.length} vehicles across Mumbai, Delhi, Bangalore, Pune, Hyderabad.`);

  console.log(`
✅ Seed complete!

Default accounts:
  📧 customer@rentx.com  / password123  (CUSTOMER)
  📧 owner@rentx.com     / password123  (FLEET_OWNER)
  📧 admin@rentx.com     / password123  (ADMIN)

Vehicles seeded: ${inserted.length}
Types: scooter, ev, bike, hatchback, sedan, suv, car, luxury
Cities: Mumbai, Delhi, Bangalore, Pune, Hyderabad
`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});

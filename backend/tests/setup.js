/**
 * Jest global setup — starts an in-memory MongoDB REPLICA SET before ALL test files.
 *
 * IMPORTANT: We use replSet: { count: 1 } because booking.service.js uses
 * MongoDB transactions (startSession/startTransaction). Transactions require
 * a replica set, even for a single-node "replica set". Without this, the
 * booking transaction tests throw "Transaction numbers are only allowed on a
 * replica set member or mongos" — a 500 instead of the expected 201/409.
 *
 * This is intentional and mirrors production (MongoDB Atlas is always a replica set).
 */

import { MongoMemoryReplSet } from "mongodb-memory-server";

let replSet;

export default async function globalSetup() {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 }, // Single-node replica set — supports transactions
  });

  const uri = replSet.getUri();

  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = "test_jwt_secret_minimum_64_chars_for_hmac_sha256_rentx_portfolio";
  process.env.NODE_ENV = "test";
  process.env.PORT = "5001";
  process.env.RAZORPAY_KEY_ID = "rzp_test_dummy";
  process.env.RAZORPAY_KEY_SECRET = "dummy_razorpay_secret_32chars_ok";
  process.env.RAZORPAY_WEBHOOK_SECRET = "dummy_webhook_secret_32chars_ok_";
  process.env.GEMINI_API_KEY = "dummy_gemini_key";
  process.env.FRONTEND_URL = "http://localhost:5173";

  global.__REPLSET__ = replSet;
}

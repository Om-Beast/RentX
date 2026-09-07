/**
 * Per-test-file setup helper.
 * Each test file calls connectForTests() in beforeAll and disconnectAfterTests() in afterAll.
 *
 * Why not use globalSetup for mongoose connection:
 * globalSetup runs in a separate worker process. Mongoose connections don't
 * survive process boundaries — each test worker needs its own connection.
 */

import mongoose from "mongoose";

export async function connectForTests() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not set. Ensure globalSetup ran first.");
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

export async function disconnectAfterTests() {
  await mongoose.disconnect();
}

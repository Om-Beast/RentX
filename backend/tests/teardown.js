/**
 * Jest global teardown — stops the in-memory MongoDB replica set after all tests.
 */
export default async function globalTeardown() {
  if (global.__REPLSET__) {
    await global.__REPLSET__.stop();
  }
}

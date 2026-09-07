import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("Database", "DB_CONNECTED", {
      name: mongoose.connection.db.databaseName,
    });
  } catch (error) {
    logger.error("Database", "DB_CONNECTION_FAILED", {}, error);
    process.exit(1);
  }
};

export default connectDB;
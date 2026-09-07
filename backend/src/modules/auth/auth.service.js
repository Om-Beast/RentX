import generateToken from "../../utils/generateToken.js";
import bcrypt from "bcryptjs";
import { findUserByEmail, createUser } from "./auth.repository.js";
import { ValidationError, AuthenticationError } from "../../utils/errors.js";
import logger from "../../utils/logger.js";

export const registerUserService = async ({ name, email, password, role }) => {
  // Validate required fields upfront — throw typed ValidationError (→ 400) not raw errors (→ 500)
  if (!name || !email || !password) {
    throw new ValidationError("name, email, and password are required");
  }
  if (typeof password !== "string" || password.length < 6) {
    throw new ValidationError("Password must be at least 6 characters");
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ValidationError("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await createUser({ name, email, password: hashedPassword, role });

  logger.info("AuthService", "USER_REGISTERED", { userId: user._id, role: user.role });

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};


export const loginUserService = async ({ email, password }) => {
  const user = await findUserByEmail(email);

  // Deliberate: same error for user-not-found and wrong-password (prevents user enumeration)
  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    logger.warn("AuthService", "LOGIN_FAILED", { email });
    throw new AuthenticationError("Invalid email or password");
  }

  if (user.isSuspended) {
    throw new AuthenticationError("Your account has been suspended. Please contact support.");
  }

  const token = generateToken(user._id);

  logger.info("AuthService", "USER_LOGIN", {
    userId: user._id,
    role: user.role,
  });

  const userObj = user.toObject();
  delete userObj.password;

  return { user: userObj, token };
};
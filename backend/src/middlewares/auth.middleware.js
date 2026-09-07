import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AuthenticationError, AuthorizationError } from "../utils/errors.js";
import logger from "../utils/logger.js";

/**
 * Verifies the Bearer JWT from Authorization header.
 * Attaches the authenticated user to req.user.
 * Throws AuthenticationError (401) on any failure.
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("No authentication token provided");
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      throw new AuthenticationError(
        jwtErr.name === "TokenExpiredError"
          ? "Authentication token has expired"
          : "Invalid authentication token"
      );
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      throw new AuthenticationError("User account not found");
    }

    if (user.isSuspended) {
      throw new AuthorizationError("Your account has been suspended");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based access control guard.
 * Must be used AFTER protect().
 *
 * Usage: authorize("FLEET_OWNER", "ADMIN")
 * Throws AuthorizationError (403) if user role is not in the allowed list.
 */
export const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AuthenticationError("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn("AuthMiddleware", "AUTHZ_FAILURE", {
        requestId: req.requestId,
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
      });
      return next(
        new AuthorizationError(
          `This action requires one of the following roles: ${roles.join(", ")}`
        )
      );
    }

    next();
  };
};

/**
 * Ownership guard — ensures the authenticated user owns the resource.
 * Usage: requireOwnership(req.user._id, resource.owner)
 * Throws AuthorizationError if they don't match (and user isn't ADMIN).
 */
export const requireOwnership = (userId, ownerId, allowAdmin = true, userRole = null) => {
  const isOwner = userId.toString() === ownerId.toString();
  const isAdmin = allowAdmin && userRole === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new AuthorizationError("You do not have permission to modify this resource");
  }
};
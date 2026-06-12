import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      decoded.userId
    ).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;

    console.log("========== AUTH DEBUG ==========");
    console.log("USER ID =", user._id);
    console.log("USER EMAIL =", user.email);
    console.log("USER ROLE =", user.role);

    next();
  } catch (error) {
    console.log("AUTH ERROR:", error);

    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log(
      "ALLOWED ROLES =",
      roles
    );

    console.log(
      "CURRENT ROLE =",
      req.user?.role
    );

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    next();
  };
};
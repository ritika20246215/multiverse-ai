import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      const error = new Error("Authentication required.");
      error.status = 401;
      throw error;
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      const error = new Error("User not found.");
      error.status = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (error) {
    error.status = 401;
    next(error);
  }
};

export default authMiddleware;

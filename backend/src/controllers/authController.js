import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, age, goals = [], habits = [] } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      const error = new Error("Email already in use.");
      error.status = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      age,
      goals,
      habits
    });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        goals: user.goals,
        habits: user.habits,
        xp: user.xp,
        streak: user.streak
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("Invalid credentials.");
      error.status = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error("Invalid credentials.");
      error.status = 401;
      throw error;
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        goals: user.goals,
        habits: user.habits,
        behaviorProfile: user.behaviorProfile,
        analysis: user.analysis,
        mlPrediction: user.mlPrediction,
        simulation: user.simulation,
        xp: user.xp,
        streak: user.streak
      }
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};

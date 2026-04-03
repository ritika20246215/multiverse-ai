import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import LoginOtp from "../models/LoginOtp.js";
import User from "../models/User.js";
import { getGamificationSnapshot, syncDailyActivity } from "../services/gamificationService.js";
import { compareOtp, generateOtp, hashOtp, otpSecurityConfig, sendLoginOtpEmail, sendSignupOtpEmail } from "../services/otpService.js";
import { ensureEmail, ensureLength, ensurePassword, ensureStringArray } from "../utils/validation.js";

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, age, goals = [], habits = [] } = req.body;
    const normalizedName = ensureLength(name, "Name", { min: 2, max: 40 });
    const normalizedEmail = ensureEmail(email);
    const normalizedPassword = ensurePassword(password);
    const normalizedGoals = ensureStringArray(goals, "Goals");
    const normalizedHabits = ensureStringArray(habits, "Habits");
    const normalizedAge = age === undefined || age === "" ? undefined : Number(age);

    if (normalizedAge !== undefined && (!Number.isFinite(normalizedAge) || normalizedAge < 10 || normalizedAge > 120)) {
      const error = new Error("Age must be between 10 and 120.");
      error.status = 400;
      throw error;
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      const error = new Error("Email already in use.");
      error.status = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      emailVerified: false,
      password: hashedPassword,
      age: normalizedAge,
      goals: normalizedGoals,
      habits: normalizedHabits
    });

    // Send signup verification OTP to prevent fake emails and ensure ownership.
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    await LoginOtp.deleteMany({ email: normalizedEmail, purpose: "signup" });
    await LoginOtp.create({ email: normalizedEmail, userId: user._id, otpHash, purpose: "signup" });

    let devOtpPreview;
    try {
      await sendSignupOtpEmail(normalizedEmail, otp);
    } catch (emailError) {
      // Developer-friendly fallback: expose OTP in response if no SMTP configured
      devOtpPreview = otp;
    }

    res.status(201).json({
      otpRequired: true,
      purpose: "signup",
      message: "Account created. Verify your email using the OTP sent to your inbox.",
      email: normalizedEmail,
      expiresIn: otpSecurityConfig.expirySeconds,
      ...(devOtpPreview ? { devOtpPreview } : {})
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = ensureEmail(email);
    ensurePassword(password);
    const user = await User.findOne({ email: normalizedEmail });

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

    if (!user.emailVerified) {
      // If signup verification has not completed, send/refresh signup OTP and ask user to verify
      const otp = generateOtp();
      const otpHash = await hashOtp(otp);

      await LoginOtp.deleteMany({ email: normalizedEmail, purpose: "signup" });
      await LoginOtp.create({ email: normalizedEmail, userId: user._id, otpHash, purpose: "signup" });

      let devOtpPreview;
      try {
        await sendSignupOtpEmail(normalizedEmail, otp);
      } catch (emailError) {
        devOtpPreview = otp;
      }

      return res.status(403).json({
        otpRequired: true,
        purpose: "signup",
        message: "Please verify your email before logging in. OTP sent to your email.",
        email: normalizedEmail,
        expiresIn: otpSecurityConfig.expirySeconds,
        ...(devOtpPreview ? { devOtpPreview } : {})
      });
    }

    const existingOtp = await LoginOtp.findOne({ email: normalizedEmail, purpose: "login" }).sort({ createdAt: -1 });

    if (existingOtp && Date.now() - existingOtp.createdAt.getTime() < otpSecurityConfig.cooldownMs) {
      const remainingMs = otpSecurityConfig.cooldownMs - (Date.now() - existingOtp.createdAt.getTime());
      const error = new Error(`Please wait ${Math.ceil(remainingMs / 1000)} seconds before requesting another OTP.`);
      error.status = 429;
      throw error;
    }

    await LoginOtp.deleteMany({ email: normalizedEmail, purpose: "login" });

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    await LoginOtp.create({
      email: normalizedEmail,
      userId: user._id,
      otpHash,
      attempts: 0,
      purpose: "login"
    });

    let devOtpPreview;
    try {
      await sendLoginOtpEmail(normalizedEmail, otp);
    } catch (emailError) {
      devOtpPreview = otp;
    }

    res.json({
      otpRequired: true,
      purpose: "login",
      message: "OTP sent successfully. Enter the code to finish logging in.",
      email: normalizedEmail,
      expiresIn: otpSecurityConfig.expirySeconds,
      ...(devOtpPreview ? { devOtpPreview } : {})
    });
  } catch (error) {
    next(error);
  }
};

export const verifyLoginOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = ensureEmail(email);

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
      const error = new Error("A valid 6-digit OTP is required.");
      error.status = 400;
      throw error;
    }

    const otpRecord = await LoginOtp.findOne({ email: normalizedEmail, purpose: "login" }).sort({ createdAt: -1 });

    if (!otpRecord) {
      const error = new Error("No valid OTP found. Request a new login code.");
      error.status = 400;
      throw error;
    }

    if (Date.now() - otpRecord.createdAt.getTime() > otpSecurityConfig.expirySeconds * 1000) {
      await LoginOtp.deleteOne({ _id: otpRecord._id });
      const error = new Error("OTP has expired. Request a new login code.");
      error.status = 400;
      throw error;
    }

    if (otpRecord.attempts >= otpSecurityConfig.maxAttempts) {
      await LoginOtp.deleteOne({ _id: otpRecord._id });
      const error = new Error("Too many failed OTP attempts. Request a new login code.");
      error.status = 400;
      throw error;
    }

    const isValid = await compareOtp(otp.trim(), otpRecord.otpHash);

    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const remainingAttempts = Math.max(0, otpSecurityConfig.maxAttempts - otpRecord.attempts);
      const error = new Error(`Invalid OTP. ${remainingAttempts} attempt(s) remaining.`);
      error.status = 400;
      error.remainingAttempts = remainingAttempts;
      throw error;
    }

    const user = await User.findById(otpRecord.userId);
    if (!user) {
      await LoginOtp.deleteOne({ _id: otpRecord._id });
      const error = new Error("User not found for this OTP.");
      error.status = 404;
      throw error;
    }

    const dailyActivity = syncDailyActivity(user);
    await user.save();
    await LoginOtp.deleteMany({ email: normalizedEmail, purpose: "login" });

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
      },
      gamification: getGamificationSnapshot(user, {
        loginRewardXp: dailyActivity.xpAwarded,
        streakBonusXpAwarded: dailyActivity.streakBonusAwarded,
        alreadyActiveToday: dailyActivity.alreadyActiveToday
      })
    });
  } catch (error) {
    next(error);
  }
};

export const verifySignupOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = ensureEmail(email);

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
      const error = new Error("A valid 6-digit OTP is required.");
      error.status = 400;
      throw error;
    }

    const otpRecord = await LoginOtp.findOne({ email: normalizedEmail, purpose: "signup" }).sort({ createdAt: -1 });

    if (!otpRecord) {
      const error = new Error("No valid verification OTP found. Request a new code.");
      error.status = 400;
      throw error;
    }

    if (Date.now() - otpRecord.createdAt.getTime() > otpSecurityConfig.expirySeconds * 1000) {
      await LoginOtp.deleteOne({ _id: otpRecord._id });
      const error = new Error("OTP has expired. Request a new code.");
      error.status = 400;
      throw error;
    }

    if (otpRecord.attempts >= otpSecurityConfig.maxAttempts) {
      await LoginOtp.deleteOne({ _id: otpRecord._id });
      const error = new Error("Too many failed OTP attempts. Request a new code.");
      error.status = 400;
      throw error;
    }

    const isValid = await compareOtp(otp.trim(), otpRecord.otpHash);

    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const remainingAttempts = Math.max(0, otpSecurityConfig.maxAttempts - otpRecord.attempts);
      const error = new Error(`Invalid OTP. ${remainingAttempts} attempt(s) remaining.`);
      error.status = 400;
      error.remainingAttempts = remainingAttempts;
      throw error;
    }

    const user = await User.findById(otpRecord.userId);
    if (!user) {
      await LoginOtp.deleteOne({ _id: otpRecord._id });
      const error = new Error("User not found for this OTP.");
      error.status = 404;
      throw error;
    }

    user.emailVerified = true;
    await user.save();
    await LoginOtp.deleteMany({ email: normalizedEmail, purpose: "signup" });

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
      },
      gamification: getGamificationSnapshot(user, {
        loginRewardXp: 0,
        streakBonusXpAwarded: 0,
        alreadyActiveToday: false
      })
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const dailyActivity = syncDailyActivity(user);
    await user.save();

    res.json({
      user,
      gamification: getGamificationSnapshot(user, {
        loginRewardXp: dailyActivity.xpAwarded,
        streakBonusXpAwarded: dailyActivity.streakBonusAwarded,
        alreadyActiveToday: dailyActivity.alreadyActiveToday
      })
    });
  } catch (error) {
    next(error);
  }
};

import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    strengths: [String],
    weaknesses: [String],
    personalityType: String,
    summary: String,
    dailyTasks: [
      {
        title: String,
        description: String,
        difficulty: {
          type: String,
          enum: ["Easy", "Medium", "Hard"]
        }
      }
    ]
  },
  { _id: false }
);

const predictionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      enum: ["High", "Average", "Negative"]
    },
    probabilities: {
      High: Number,
      Average: Number,
      Negative: Number
    },
    accuracy: Number
  },
  { _id: false }
);

const behaviorProfileSchema = new mongoose.Schema(
  {
    studyHours: Number,
    sleepHours: Number,
    exercise: Boolean,
    screenTime: Number,
    consistency: Number,
    procrastination: Number,
    goalClarity: Number
  },
  { _id: false }
);

const simulationSchema = new mongoose.Schema(
  {
    futureStory: String,
    alternateStory: String,
    futureMessage: String
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: Number,
    goals: [String],
    habits: [String],
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastQuestCompletedAt: Date,
    behaviorProfile: behaviorProfileSchema,
    analysis: analysisSchema,
    mlPrediction: predictionSchema,
    simulation: simulationSchema,
    guilds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Guild"
      }
    ]
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;

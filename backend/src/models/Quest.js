import mongoose from "mongoose";

const questSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: String,
    description: String,
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy"
    },
    xpReward: Number,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  },
  { timestamps: true }
);

const Quest = mongoose.model("Quest", questSchema);

export default Quest;

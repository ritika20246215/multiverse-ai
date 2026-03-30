import mongoose from "mongoose";

const guildSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    focus: String,
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  { timestamps: true }
);

const Guild = mongoose.model("Guild", guildSchema);

export default Guild;

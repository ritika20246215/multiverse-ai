const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Task title is required."],
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    default: "medium"
  },
  completed: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model("Task", taskSchema);

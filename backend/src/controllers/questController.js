import Quest from "../models/Quest.js";
import User from "../models/User.js";
import { buildQuestTemplates, getQuestXp, normalizeAiTasks } from "../services/questService.js";

export const generateQuests = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const existing = await Quest.find({ user: user._id, completed: false }).sort({ createdAt: -1 });

    if (existing.length) {
      return res.json({ quests: existing });
    }

    const aiTasks = normalizeAiTasks(user.analysis?.dailyTasks || []);
    const templates = aiTasks.length ? aiTasks : buildQuestTemplates(user.analysis?.weaknesses || []);
    const quests = await Quest.insertMany(
      templates.map((quest) => ({
        ...quest,
        user: user._id
      }))
    );

    res.status(201).json({ quests });
  } catch (error) {
    next(error);
  }
};

export const completeQuest = async (req, res, next) => {
  try {
    const quest = await Quest.findOne({
      _id: req.params.questId,
      user: req.user._id
    });

    if (!quest) {
      const error = new Error("Quest not found.");
      error.status = 404;
      throw error;
    }

    if (quest.completed) {
      return res.json({ quest, xp: req.user.xp, streak: req.user.streak });
    }

    quest.completed = true;
    quest.completedAt = new Date();
    quest.xpReward = getQuestXp(quest.difficulty);
    await quest.save();

    const user = await User.findById(req.user._id);
    const today = new Date().toDateString();
    const lastCompleted = user.lastQuestCompletedAt ? new Date(user.lastQuestCompletedAt).toDateString() : null;

    user.xp += quest.xpReward;
    user.streak = lastCompleted === today ? user.streak : user.streak + 1;
    user.lastQuestCompletedAt = new Date();
    await user.save();

    res.json({
      quest,
      xp: user.xp,
      streak: user.streak
    });
  } catch (error) {
    next(error);
  }
};

import Quest from "../models/Quest.js";
import User from "../models/User.js";
import { generateSimulationNarrative } from "../services/groqService.js";
import { predictFutureOutcome } from "../services/mlService.js";

const normalizeBehavior = (payload) => ({
  studyHours: Number(payload.studyHours),
  sleepHours: Number(payload.sleepHours),
  exercise: Boolean(payload.exercise),
  screenTime: Number(payload.screenTime),
  consistency: Number(payload.consistency),
  procrastination: Number(payload.procrastination),
  goalClarity: Number(payload.goalClarity)
});

export const analyzeUser = async (req, res, next) => {
  try {
    const behaviorProfile = normalizeBehavior(req.body);
    const mlResponse = await predictFutureOutcome({
      study_hours: behaviorProfile.studyHours,
      sleep_hours: behaviorProfile.sleepHours,
      exercise: behaviorProfile.exercise ? 1 : 0,
      screen_time: behaviorProfile.screenTime,
      consistency: behaviorProfile.consistency,
      procrastination: behaviorProfile.procrastination,
      goal_clarity: behaviorProfile.goalClarity
    });

    const user = await User.findById(req.user._id);
    const simulation = await generateSimulationNarrative({
      name: user.name,
      goals: user.goals,
      habits: user.habits,
      behaviorProfile,
      prediction: mlResponse.prediction,
      probabilities: mlResponse.probabilities
    });

    user.behaviorProfile = behaviorProfile;
    user.mlPrediction = {
      label: mlResponse.prediction,
      probabilities: mlResponse.probabilities
    };
    user.analysis = {
      strengths: simulation.strengths,
      weaknesses: simulation.weaknesses,
      personalityType: simulation.modelUsed
        ? `${simulation.personalityType} · via ${simulation.modelUsed}`
        : simulation.personalityType,
      summary: simulation.summary,
      dailyTasks: simulation.dailyTasks
    };
    user.simulation = {
      futureStory: simulation.futureStory,
      alternateStory: simulation.alternateStory,
      futureMessage: simulation.futureMessage
    };
    await user.save();

    await Quest.deleteMany({ user: user._id, completed: false });

    res.json({
      prediction: user.mlPrediction,
      analysis: user.analysis,
      simulation: user.simulation
    });
  } catch (error) {
    next(error);
  }
};

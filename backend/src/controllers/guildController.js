import Guild from "../models/Guild.js";
import User from "../models/User.js";

export const listGuilds = async (_req, res, next) => {
  try {
    const guilds = await Guild.find().sort({ createdAt: -1 }).populate("members", "name mlPrediction xp");
    res.json({ guilds });
  } catch (error) {
    next(error);
  }
};

export const createGuild = async (req, res, next) => {
  try {
    const { name, description, focus } = req.body;
    const guild = await Guild.create({
      name,
      description,
      focus,
      members: [req.user._id]
    });

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { guilds: guild._id }
    });

    res.status(201).json({ guild });
  } catch (error) {
    next(error);
  }
};

export const joinGuild = async (req, res, next) => {
  try {
    const guild = await Guild.findByIdAndUpdate(
      req.params.guildId,
      { $addToSet: { members: req.user._id } },
      { new: true }
    );

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { guilds: guild._id }
    });

    res.json({ guild });
  } catch (error) {
    next(error);
  }
};

const difficultyXp = {
  Easy: 20,
  Medium: 40,
  Hard: 75
};

export const buildQuestTemplates = (weaknesses = []) => {
  const mapped = weaknesses.slice(0, 3).map((weakness, index) => {
    const templates = [
      {
        title: "Focused Power Hour",
        description: `Spend 60 uninterrupted minutes improving: ${weakness}.`,
        difficulty: "Hard"
      },
      {
        title: "Micro Upgrade Sprint",
        description: `Spend 25 minutes taking one practical action on: ${weakness}.`,
        difficulty: "Medium"
      },
      {
        title: "Momentum Ritual",
        description: `Write one reflection and one next step to reduce: ${weakness}.`,
        difficulty: "Easy"
      }
    ];

    return templates[index % templates.length];
  });

  return mapped.length
    ? mapped.map((quest) => ({
        ...quest,
        xpReward: difficultyXp[quest.difficulty]
      }))
    : [
        {
          title: "Daily Alignment",
          description: "Spend 20 minutes aligning today's actions with your future self.",
          difficulty: "Easy",
          xpReward: difficultyXp.Easy
        }
      ];
};

export const getQuestXp = (difficulty) => difficultyXp[difficulty] || difficultyXp.Easy;

export const normalizeAiTasks = (dailyTasks = []) =>
  dailyTasks.slice(0, 3).map((task) => ({
    title: task.title,
    description: task.description,
    difficulty: task.difficulty,
    xpReward: getQuestXp(task.difficulty)
  }));

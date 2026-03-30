import dotenv from "dotenv";
import app from "./src/app.js";
import connectDatabase from "./src/config/db.js";

dotenv.config();

const port = process.env.PORT || 5000;

const startServer = async () => {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`Parallel You backend running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

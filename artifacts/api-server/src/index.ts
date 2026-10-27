import app from "./app";
import { logger } from "./lib/logger";
import { connectToMongoDB } from "./lib/mongodb";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

try {
  await connectToMongoDB();
  app.listen(port, () => {
    logger.info({ port }, "Server listening");
  });
} catch (error) {
  // Avoid logging a MongoDB error message, which may contain the connection URI.
  logger.error(
    { errorName: error instanceof Error ? error.name : "UnknownError" },
    "Could not connect to MongoDB Atlas",
  );
  process.exit(1);
}


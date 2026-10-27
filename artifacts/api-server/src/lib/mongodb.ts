import mongoose from "mongoose";

export async function connectToMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required to connect to MongoDB Atlas");
  }

  await mongoose.connect(uri);
}

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
};

export default connectDB;
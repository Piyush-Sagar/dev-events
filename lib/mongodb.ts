import mongoose from "mongoose";

const globalForMongo = globalThis as typeof globalThis & {
  mongoConnection?: Promise<typeof mongoose> | null;
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured. Add it to .env.local to enable saving events and bookings.');
  if (mongoose.connection.readyState === 1) return;
  if (!globalForMongo.mongoConnection) {
    globalForMongo.mongoConnection = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
  }
  const connection = globalForMongo.mongoConnection;
  try {
    await connection;
  } finally {
    if (globalForMongo.mongoConnection === connection) {
      globalForMongo.mongoConnection = null;
    }
  }
};

export default connectDB;

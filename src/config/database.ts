import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDatabase = async (uri?: string): Promise<typeof mongoose> => {
  const connectionUri = uri || env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(connectionUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed successfully.');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    throw error;
  }
};

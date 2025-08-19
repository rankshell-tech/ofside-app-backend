import mongoose from 'mongoose';
import { config } from './env';

export const connectDatabase = async (): Promise<void> => {
  try {
    // Check if MongoDB URI is properly configured
    if (!config.mongoUri || config.mongoUri.includes('localhost') || config.mongoUri.includes('127.0.0.1')) {
      console.warn('⚠️  MongoDB not configured or using localhost. Running in development mode without database.');
      console.warn('📝 To connect to MongoDB:');
      console.warn('   1. Set up MongoDB Atlas (cloud) or local MongoDB server');
      console.warn('   2. Update MONGO_URI in your .env file');
      console.warn('   3. Restart the server');
      return;
    }

    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn('⚠️  Database connection failed:', error instanceof Error ? error.message : error);
    console.warn('🚀 Server will continue running without database connection.');
    console.warn('📝 To fix this:');
    console.warn('   1. Ensure MongoDB is running (if using local MongoDB)');
    console.warn('   2. Or set up MongoDB Atlas for cloud database');
    console.warn('   3. Update MONGO_URI in your .env file');
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});
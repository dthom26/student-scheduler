import mongoose from 'mongoose';
import { MONGO_URI, NODE_ENV } from '../config/env.js';

if (!MONGO_URI) {
  throw new Error('MONGO_URI is not defined in environment variables');
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`MongoDB connected successfully in ${NODE_ENV} mode.`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

export default connectDB; 
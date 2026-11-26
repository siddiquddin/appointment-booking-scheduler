import mongoose from 'mongoose';

const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

/**
 * Connects to MongoDB Atlas with exponential backoff retries.
 * @param {string} uri MongoDB connection URI
 * @param {number} maxRetries Maximum retry attempts
 */
export async function connectDB(uri, maxRetries = 5) {
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  mongoose.set('strictQuery', true);

  let attempt = 0;
  while (attempt < maxRetries) {
    attempt += 1;
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000
      });
      console.log(`[DB] Connected to MongoDB Atlas (${mongoose.connection.host})`);
      return mongoose.connection;
    } catch (err) {
      console.error(`[DB] Connection attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt >= maxRetries) {
        throw err;
      }
      const delayMs = Math.min(2000 * attempt, 10000);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('[DB] MongoDB connection closed gracefully');
  }
}

export function getDbStatus() {
  const code = mongoose.connection.readyState;
  return {
    connected: code === 1,
    state: READY_STATES[code] || 'unknown',
    readyState: code
  };
}

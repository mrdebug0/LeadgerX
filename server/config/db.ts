import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getDatabaseState() {
  const connected = isMongoConnected();
  return {
    connected,
    mode: connected ? ('mongodb' as const) : ('fallback' as const),
    dbName: connected ? (mongoose.connection.name || 'leadgerx') : 'localstore',
    host: connected ? mongoose.connection.host : 'local-json'
  };
}

export async function validateDatabaseHealth(): Promise<{
  healthy: boolean;
  mode: 'mongodb' | 'fallback';
  readyState: number;
  dbName: string;
  host: string;
  latencyMs?: number;
  message?: string;
}> {
  const state = getDatabaseState();
  if (state.mode === 'mongodb') {
    const readyState = mongoose.connection.readyState;
    if (readyState !== 1) {
      return {
        healthy: false,
        mode: 'mongodb',
        readyState,
        dbName: state.dbName,
        host: state.host,
        message: `MongoDB connection is not in ready state (readyState=${readyState})`
      };
    }
    const start = Date.now();
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
      const latencyMs = Date.now() - start;
      return {
        healthy: true,
        mode: 'mongodb',
        readyState: 1,
        dbName: state.dbName,
        host: state.host,
        latencyMs
      };
    } catch (err: any) {
      return {
        healthy: false,
        mode: 'mongodb',
        readyState,
        dbName: state.dbName,
        host: state.host,
        message: err.message || 'Failed to ping MongoDB Atlas'
      };
    }
  }

  // Fallback mode (LocalStore persistence)
  return {
    healthy: true,
    mode: 'fallback',
    readyState: 1,
    dbName: 'localstore',
    host: 'local-json',
    message: 'Local persistence engine active and operational'
  };
}

export async function connectDatabase(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri || uri.includes('mock') || uri.includes('<password>') || uri.includes('username:password')) {
    console.log('====================================================');
    console.log('🟡 [LeadgerX Database] MongoDB URI is not configured.');
    console.log('📁 Persistence Mode: Local/Sandbox Fallback Mode (LocalStore)');
    console.log('====================================================');
    return null;
  }

  try {
    const targetDbName = process.env.MONGODB_DB_NAME || 'leadgerx';
    const options: mongoose.ConnectOptions = {
      dbName: targetDbName,
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    };

    mongoose.connection.on('connected', () => {
      console.log('====================================================');
      console.log('🟢 [LeadgerX Database] MongoDB Atlas Connected Successfully!');
      console.log(`📦 Target Database: ${targetDbName}`);
      console.log('🚀 Persistence Mode: MongoDB PRIMARY (LocalStore disabled)');
      console.log('====================================================');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection failure:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ Mongoose connection disconnected.');
    });

    const conn = await mongoose.connect(uri, options);
    return conn;
  } catch (error: any) {
    console.warn('====================================================');
    console.warn('⚠️ [LeadgerX Database] Could not connect to MongoDB Atlas:', error.message);
    console.warn('📁 Falling back to Local/Sandbox Fallback Mode (LocalStore)');
    console.warn('====================================================');
    return null;
  }
}


const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_qr_system';

  try {
    // Attempt MongoDB connection with a 5 second timeout
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB Connected to: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return true;
  } catch (err) {
    console.warn(`⚠️ External MongoDB connection notice (${mongoUri}): ${err.message}`);
    console.log('🔄 Trying embedded in-memory MongoDB fallback...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const inMemoryUri = memoryServer.getUri();
      
      await mongoose.connect(inMemoryUri);
      console.log(`✅ Connected to Embedded In-Memory MongoDB at: ${inMemoryUri}`);
      return true;
    } catch (memErr) {
      console.warn('ℹ️ In-Memory fallback notice:', memErr.message);
      console.log('----------------------------------------------------------------------');
      console.log('📌 NOTE: Please configure your MONGO_URI in "server/.env" (e.g. MongoDB Atlas free tier URI)');
      console.log('   Example: MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/restaurant_qr_system');
      console.log('   The API server and WebSocket engine remain online on port', process.env.PORT || 5000);
      console.log('----------------------------------------------------------------------');
      return false;
    }
  }
};

const closeDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
  } catch (e) {
    // Ignore close errors
  }
};

module.exports = { connectDB, closeDB };

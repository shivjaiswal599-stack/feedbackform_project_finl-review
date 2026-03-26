require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
  // Use environment variable for security
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.log('❌ MONGODB_URI not found in environment variables');
    return;
  }
  
  console.log('\n🔍 Testing MongoDB connection...');
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ SUCCESS: Connected to MongoDB!');
    await client.close();
  } catch (err) {
    console.log('❌ Failed:', err.message);
  }
}

testConnection();

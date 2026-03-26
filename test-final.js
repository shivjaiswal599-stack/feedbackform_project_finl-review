require('dotenv').config();
const { MongoClient } = require('mongodb');

console.log('Testing MongoDB connection...');
console.log('URI set:', !!process.env.MONGODB_URI);

async function test() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
    
    const db = client.db(process.env.DB_NAME);
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.length);
    
    await client.close();
  } catch (err) {
    console.log('❌ Failed:', err.message);
  }
}

test();

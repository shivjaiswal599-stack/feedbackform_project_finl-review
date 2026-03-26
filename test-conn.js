const { MongoClient } = require('mongodb');

async function testConnection() {
  // Try different connection formats
  const uris = [
    'mongodb+srv://shivjaiswal599_db_user:Shivam9262676540@cluster0.lobvgup.mongodb.net/?retryWrites=true&w=majority',
    'mongodb://shivjaiswal599_db_user:Shivam9262676540@cluster0-shard-00-00.lobvgup.mongodb.net:27017,cluster0-shard-00-01.lobvgup.mongodb.net:27017,cluster0-shard-00-02.lobvgup.mongodb.net:27017/?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority'
  ];
  
  for (let i = 0; i < uris.length; i++) {
    console.log(`\n🔍 Test ${i + 1}:`);
    try {
      const client = new MongoClient(uris[i]);
      await client.connect();
      console.log('✅ SUCCESS!');
      await client.close();
      return;
    } catch (err) {
      console.log('❌ Failed:', err.message);
    }
  }
}

testConnection();

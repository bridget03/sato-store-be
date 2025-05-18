import { MongoClient } from 'mongodb';
import { users, products, carts } from './sample-data.js';
import dotenv from 'dotenv';

dotenv.config();

async function importSampleData() {
  const uri = process.env.MONGODB_URI;  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing data
    console.log('Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('products').deleteMany({});
    await db.collection('carts').deleteMany({});
    
    // Insert sample data
    console.log('Inserting sample data...');
    
    if (users.length > 0) {
      const usersResult = await db.collection('users').insertMany(users);
      console.log(`${usersResult.insertedCount} users inserted`);
    }
    
    if (products.length > 0) {
      const productsResult = await db.collection('products').insertMany(products);
      console.log(`${productsResult.insertedCount} products inserted`);
    }
    
    if (carts.length > 0) {
      const cartsResult = await db.collection('carts').insertMany(carts);
      console.log(`${cartsResult.insertedCount} carts inserted`);
    }
    
    console.log('Sample data imported successfully');
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the import function
importSampleData().catch(console.error); 
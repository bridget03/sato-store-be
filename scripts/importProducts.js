import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import Product from '../src/models/productModel.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const importData = async () => {
    try {
        // Connect to MongoDB
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Drop the old 'products' collection if it exists
        try {
            await conn.connection.db.dropCollection('products');
            console.log('Old "products" collection dropped');
        } catch (err) {
            // Ignore error if collection doesn't exist
            console.log('No old "products" collection found');
        }

        // Delete all existing products from 'product' collection
        await Product.deleteMany({});
        console.log('All existing products deleted from "product" collection');

        // Read data.json file
        const jsonPath = join(__dirname, '../data.json');
        const jsonData = JSON.parse(readFileSync(jsonPath, 'utf-8'));
        
        // Extract products array from contents
        const products = jsonData.contents;

        if (!products || !Array.isArray(products)) {
            throw new Error('Invalid data format: contents should be an array of products');
        }

        // Import new products
        await Product.insertMany(products);
        console.log(`${products.length} products imported successfully to "product" collection`);

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

importData(); 
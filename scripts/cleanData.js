import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VALID_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const DEFAULT_AMOUNT = "1000";

try {
    // Read the original file
    const jsonPath = join(__dirname, '../data.json');
    const rawData = readFileSync(jsonPath, 'utf-8');
    
    // Parse JSON
    const jsonData = JSON.parse(rawData);
    
    // Get unique products by name (since we're removing _id)
    const uniqueProducts = Array.from(
        new Map(jsonData.contents.map(item => [item.name, item])).values()
    );
    
    // Clean products data
    const cleanedProducts = uniqueProducts.map(product => {
        // Remove _id, __v and clean up URLs
        const { _id, __v, ...cleanProduct } = product;

        // Clean and validate size data
        let cleanSize;
        if (Array.isArray(product.size)) {
            if (typeof product.size[0] === 'string') {
                // If size is array of strings, convert to proper format with only valid sizes
                cleanSize = product.size
                    .filter(size => VALID_SIZES.includes(size.toUpperCase()))
                    .map(size => ({
                        name: size.toUpperCase(),
                        amount: DEFAULT_AMOUNT
                    }));
            } else {
                // If size is array of objects, validate and clean
                cleanSize = product.size
                    .filter(size => size && size.name)
                    .map(size => ({
                        name: size.name.toUpperCase(),
                        amount: size.amount || DEFAULT_AMOUNT
                    }))
                    .filter(size => VALID_SIZES.includes(size.name));
            }
        }

        // If no valid sizes found, set default sizes
        if (!cleanSize || cleanSize.length === 0) {
            cleanSize = ['M', 'L'].map(size => ({
                name: size,
                amount: DEFAULT_AMOUNT
            }));
        }

        return {
            ...cleanProduct,
            images: product.images.map(url => url.replace(/\s+/g, '')),
            size: cleanSize
        };
    });
    
    // Create new clean data object
    const cleanData = {
        contents: cleanedProducts,
        total: cleanedProducts.length,
        page: "1"
    };
    
    // Format and write back to file
    const formattedData = JSON.stringify(cleanData, null, 2);
    writeFileSync(jsonPath, formattedData, 'utf8');
    
    console.log(`Successfully cleaned data.json. Total products: ${cleanedProducts.length}`);
} catch (error) {
    console.error('Error cleaning data:', error);
    process.exit(1);
} 
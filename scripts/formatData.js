import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
    // Read the original file
    const jsonPath = join(__dirname, '../data.json');
    const rawData = readFileSync(jsonPath, 'utf-8');
    
    // Remove any BOM and special characters
    const cleanData = rawData.replace(/^\uFEFF/, '').trim();
    
    // Parse and stringify to ensure valid JSON
    const jsonData = JSON.parse(cleanData);
    
    // Format the data with proper indentation
    const formattedData = JSON.stringify(jsonData, null, 2);
    
    // Write back to file
    writeFileSync(jsonPath, formattedData, 'utf8');
    console.log('Successfully formatted data.json');
} catch (error) {
    console.error('Error formatting data:', error);
    process.exit(1);
} 
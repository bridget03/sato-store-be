import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const vnpayConfig = {
    tmnCode: process.env.VNP_TMN_CODE || '',
    hashSecret: process.env.VNP_HASH_SECRET || '',
    url: process.env.VNP_URL || '',
    returnUrl: process.env.VNP_RETURN_URL || ''
}; 
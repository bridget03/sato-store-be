import mongoose from 'mongoose';

const sizeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['S', 'M', 'L', 'XL', 'XXL']
    },
    amount: {
        type: String,
        required: true
    }
});
// 
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter product name'],
        trim: true,
        maxLength: [100, 'Product name cannot exceed 100 characters']
    },
    price: {
        type: Number,
        required: [true, 'Please enter product price']
    },
    description: {
        type: String,
        required: [true, 'Please enter product description']
    },
    type: {
        type: String,
        required: [true, 'Please enter product type']
    },
    size: [sizeSchema],
    material: {
        type: String,
        required: [true, 'Please enter product material']
    },
    images: [{
        type: String,
        required: true
    }],
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    versionKey: false, // Disable __v field
    collection: 'product' // Explicitly set collection name to 'product'
});

export default mongoose.model('Product', productSchema); 
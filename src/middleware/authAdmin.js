import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const authAdmin = async (req, res, next) => {
    try {
        // Verify token
        const token = req.header('Authorization');
        if (!token) return res.status(401).json({ msg: 'Access denied' });

        // Verify token and get user id
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        if (!decoded) return res.status(400).json({ msg: 'Invalid token' });

        // Check if user exists and is admin
        const user = await User.findById(decoded.id);
        if (!user) return res.status(400).json({ msg: 'User not found' });
        
        if (user.role !== 'admin') 
            return res.status(403).json({ msg: 'Admin resources access denied' });

        req.user = user;
        next();
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
};

export default authAdmin; 
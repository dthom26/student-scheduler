import jwt from "jsonwebtoken";
import { JWT_SECRET, MANAGER_PASSWORD } from "../config/env.js";

export const login = async (req, res, next) => {
    try {
        const { password } = req.body;
        if (password === MANAGER_PASSWORD) {
            const token = jwt.sign({ role: 'manager' }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ success: true, token });
        } else {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Validate token endpoint - lightweight token validation
 * No database queries, just checks if JWT is valid
 * Used on app load to verify stored tokens
 */
export const validateToken = (req, res) => {
    // If we reach here, the verifyManagerToken middleware already validated the token
    // So we just need to return success
    res.json({ 
        valid: true, 
        role: req.user.role 
    });
};
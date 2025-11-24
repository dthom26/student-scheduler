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
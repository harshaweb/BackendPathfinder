"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const firebase_1 = require("../config/firebase");
const api_error_1 = require("../utils/api-error");
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new api_error_1.ApiError(401, 'Missing or invalid authorization header');
        }
        const token = authHeader.replace('Bearer ', '').trim();
        const decoded = await firebase_1.auth.verifyIdToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=auth.middleware.js.map
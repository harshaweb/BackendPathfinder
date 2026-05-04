"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const firebase_1 = require("../config/firebase");
const api_error_1 = require("../utils/api-error");
const request_1 = require("../utils/request");
const router = express_1.default.Router();
router.post('/signup', auth_controller_1.signup);
router.get('/me', auth_middleware_1.verifyToken, (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    res.json({
        message: 'User authenticated',
        user: req.user,
    });
});
router.post('/save-user', auth_middleware_1.verifyToken, async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const body = req.body;
        const name = (0, request_1.getString)(body.name, 'name');
        await firebase_1.db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        res.json({ message: 'User saved successfully' });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to save user' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map
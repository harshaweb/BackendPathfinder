"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = void 0;
const firebase_1 = require("../config/firebase");
const firebase_2 = require("../config/firebase");
const api_error_1 = require("../utils/api-error");
const request_1 = require("../utils/request");
const signup = async (req, res) => {
    try {
        const email = (0, request_1.getString)(req.body.email, 'email');
        const password = (0, request_1.getString)(req.body.password, 'password');
        const name = (0, request_1.getString)(req.body.name, 'name');
        const user = await firebase_1.auth.createUser({
            email,
            password,
            displayName: name,
        });
        await firebase_2.db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            name: name,
            createdAt: new Date().toISOString(),
        });
        res.json({ uid: user.uid, email: user.email });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(400).json({ message: 'Signup failed' });
    }
};
exports.signup = signup;
//# sourceMappingURL=auth.controller.js.map
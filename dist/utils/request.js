"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getString = exports.requireUser = void 0;
const api_error_1 = require("./api-error");
const requireUser = (req) => {
    const user = req.user;
    if (!user?.uid || !user.email) {
        throw new api_error_1.ApiError(401, 'Unauthorized request');
    }
    return {
        uid: user.uid,
        email: user.email,
    };
};
exports.requireUser = requireUser;
const getString = (value, fieldName) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new api_error_1.ApiError(400, `Invalid ${fieldName}`);
    }
    return value.trim();
};
exports.getString = getString;
//# sourceMappingURL=request.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/', auth_middleware_1.verifyToken, user_controller_1.listUsers);
router.get('/me', auth_middleware_1.verifyToken, user_controller_1.getMyProfile);
router.patch('/me', auth_middleware_1.verifyToken, user_controller_1.updateMyProfile);
router.get('/me/invite-eligibility', auth_middleware_1.verifyToken, user_controller_1.getMyInviteEligibility);
router.get('/:userId', auth_middleware_1.verifyToken, user_controller_1.getUserProfile);
exports.default = router;
//# sourceMappingURL=user.routes.js.map
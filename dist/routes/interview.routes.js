"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const interview_controller_1 = require("../controllers/interview.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get("/sessions", auth_middleware_1.verifyToken, interview_controller_1.listMySessions);
router.post("/sessions", auth_middleware_1.verifyToken, interview_controller_1.createSession);
router.patch("/sessions/:sessionId/status", auth_middleware_1.verifyToken, interview_controller_1.updateSessionStatus);
router.patch("/sessions/:sessionId/notes", auth_middleware_1.verifyToken, interview_controller_1.updateSessionNotes);
router.get("/sessions/:sessionId/feedback/me", auth_middleware_1.verifyToken, interview_controller_1.getMyFeedbackForSession);
router.post("/sessions/:sessionId/feedback", auth_middleware_1.verifyToken, interview_controller_1.submitFeedback);
router.delete("/sessions/:sessionId/feedback/me", auth_middleware_1.verifyToken, interview_controller_1.deleteMyFeedbackForSession);
exports.default = router;
//# sourceMappingURL=interview.routes.js.map
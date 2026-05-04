import express from "express";
import {
  createSession,
  deleteMyFeedbackForSession,
  getMyFeedbackForSession,
  listMySessions,
  submitFeedback,
  updateSessionNotes,
  updateSessionStatus,
} from "../controllers/interview.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = express.Router();
router.get("/sessions", verifyToken, listMySessions);
router.post("/sessions", verifyToken, createSession);
router.patch("/sessions/:sessionId/status", verifyToken, updateSessionStatus);
router.patch("/sessions/:sessionId/notes", verifyToken, updateSessionNotes);
router.get(
  "/sessions/:sessionId/feedback/me",
  verifyToken,
  getMyFeedbackForSession,
);
router.post("/sessions/:sessionId/feedback", verifyToken, submitFeedback);
router.delete(
  "/sessions/:sessionId/feedback/me",
  verifyToken,
  deleteMyFeedbackForSession,
);

export default router;

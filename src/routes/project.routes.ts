import express from "express";
import {
  createProject,
  deleteProject,
  getProjectBoard,
  listMyProjects,
  updateProject,
  upsertProjectBoard,
} from "../controllers/project.controller";
import { verifyToken } from "../middleware/auth.middleware";
const router = express.Router();
router.get("/", verifyToken, listMyProjects);
router.post("/", verifyToken, createProject);
router.patch("/:projectId", verifyToken, updateProject);
router.delete("/:projectId", verifyToken, deleteProject);
router.get("/:projectId/board", verifyToken, getProjectBoard);
router.put("/:projectId/board", verifyToken, upsertProjectBoard);
export default router;

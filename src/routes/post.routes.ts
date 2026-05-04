import express from 'express';
import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  listComments,
  listPosts,
  toggleLike,
  updateComment,
  updatePost,
} from '../controllers/post.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', verifyToken, listPosts);
router.post('/', verifyToken, createPost);
router.patch('/:postId', verifyToken, updatePost);
router.delete('/:postId', verifyToken, deletePost);
router.post('/:postId/like', verifyToken, toggleLike);
router.get('/:postId/comments', verifyToken, listComments);
router.post('/:postId/comments', verifyToken, addComment);
router.patch('/:postId/comments/:commentId', verifyToken, updateComment);
router.delete('/:postId/comments/:commentId', verifyToken, deleteComment);

export default router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const post_controller_1 = require("../controllers/post.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/', auth_middleware_1.verifyToken, post_controller_1.listPosts);
router.post('/', auth_middleware_1.verifyToken, post_controller_1.createPost);
router.patch('/:postId', auth_middleware_1.verifyToken, post_controller_1.updatePost);
router.delete('/:postId', auth_middleware_1.verifyToken, post_controller_1.deletePost);
router.post('/:postId/like', auth_middleware_1.verifyToken, post_controller_1.toggleLike);
router.get('/:postId/comments', auth_middleware_1.verifyToken, post_controller_1.listComments);
router.post('/:postId/comments', auth_middleware_1.verifyToken, post_controller_1.addComment);
router.patch('/:postId/comments/:commentId', auth_middleware_1.verifyToken, post_controller_1.updateComment);
router.delete('/:postId/comments/:commentId', auth_middleware_1.verifyToken, post_controller_1.deleteComment);
exports.default = router;
//# sourceMappingURL=post.routes.js.map
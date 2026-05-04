import { Router } from 'express';
import {
  ensureConversation,
  listConversations,
  listMessages,
  markRead,
  sendMessage,
} from '../controllers/conversation.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);

router.get('/', listConversations);
router.post('/', ensureConversation);
router.get('/:conversationId/messages', listMessages);
router.post('/:conversationId/messages', sendMessage);
router.patch('/:conversationId/read', markRead);

export default router;

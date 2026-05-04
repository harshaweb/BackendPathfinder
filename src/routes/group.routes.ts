import { Router } from 'express';
import {
  createGroup,
  deleteGroup,
  getGroupById,
  getGroups,
  updateGroup,
  acceptGroupInvite,
} from '../controllers/group.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.use(verifyToken);

router.get('/', getGroups);
router.post('/', createGroup);
router.get('/:groupId', getGroupById);
router.patch('/:groupId', updateGroup);
router.delete('/:groupId', deleteGroup);
router.post('/accept-invite', acceptGroupInvite);

export default router;

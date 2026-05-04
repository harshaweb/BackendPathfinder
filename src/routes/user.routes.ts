import express from 'express';
import { getMyInviteEligibility, getMyProfile, updateMyProfile, listUsers, getUserProfile } from '../controllers/user.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', verifyToken, listUsers);
router.get('/me', verifyToken, getMyProfile);
router.patch('/me', verifyToken, updateMyProfile);
router.get('/me/invite-eligibility', verifyToken, getMyInviteEligibility);
router.get('/:userId', verifyToken, getUserProfile);

export default router;

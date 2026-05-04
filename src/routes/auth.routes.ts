import express from 'express';
import { signup } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { db } from '../config/firebase';
import { ApiError } from '../utils/api-error';
import { getString, requireUser } from '../utils/request';

const router = express.Router();

router.post('/signup', signup);
router.get('/me', verifyToken, (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  res.json({
    message: 'User authenticated',
    user: req.user,
  });
});
router.post('/save-user', verifyToken, async (req, res) => {
  try {
    const user = requireUser(req);
    const body = req.body as Record<string, unknown>;
    const name = getString(body.name, 'name');

    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    res.json({ message: 'User saved successfully' });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to save user' });
  }
});

export default router;
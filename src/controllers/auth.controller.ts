import { Request, Response } from 'express';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';
import { ApiError } from '../utils/api-error';
import { getString } from '../utils/request';

export const signup = async (req: Request, res: Response) => {
  try {
    const email = getString((req.body as Record<string, unknown>).email, 'email');
    const password = getString((req.body as Record<string, unknown>).password, 'password');
    const name = getString((req.body as Record<string, unknown>).name, 'name');

    const user = await auth.createUser({
      email,
      password,
      displayName: name,
    });
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      name: name,
      createdAt: new Date().toISOString(),
    });

    res.json({ uid: user.uid, email: user.email });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: 'Signup failed' });
  }
};
import type { Request, Response } from 'express';
import { db } from '../config/firebase';
import type { FeedbackDocument, InterviewSessionDocument } from '../types/models';
import { ApiError } from '../utils/api-error';
import { getString, requireUser } from '../utils/request';

interface CreateSessionBody {
  inviteeId: string;
  proposedTimes: string;
  meetingLink: string;
  message?: string;
  topic?: string;
  
  inviterName?: string;
  inviterEmail?: string;
  inviterAvatar?: string;
  inviterRole?: string;
  
  inviteeName?: string;
  inviteeEmail?: string;
  inviteeAvatar?: string;
  inviteeRole?: string;
}

interface UpdateSessionStatusBody {
  status: InterviewSessionDocument['status'];
}

interface FeedbackBody {
  revieweeId: string;
  notes: string;
  tags?: string[];
  scores: FeedbackDocument['scores'];
}

export const listMySessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const asInviter = await db.collection('mockInterviews').where('inviterId', '==', user.uid).get();
    const asInvitee = await db.collection('mockInterviews').where('inviteeId', '==', user.uid).get();

    const merged = [...asInviter.docs, ...asInvitee.docs];
    const uniqueById = new Map<string, Record<string, unknown>>();
    merged.forEach((doc) => {
      uniqueById.set(doc.id, { id: doc.id, ...doc.data() });
    });

    const sessions = [...uniqueById.values()].sort((a, b) =>
      String(b.updatedAt ?? b.createdAt).localeCompare(String(a.updatedAt ?? a.createdAt)),
    );

    res.status(200).json(sessions);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to list sessions' });
  }
};

export const createSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const body = req.body as CreateSessionBody;
    const inviteeId = getString(body.inviteeId, 'inviteeId');
    const proposedTimes = getString(body.proposedTimes, 'proposedTimes');
    const now = new Date().toISOString();

    const payload: InterviewSessionDocument = {
      inviterId: user.uid,
      inviteeId,
      proposedTimes,
      meetingLink: getString((body as any).meetingLink, 'meetingLink'),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    
    if (body.inviterName !== undefined) payload.inviterName = body.inviterName;
    if (body.inviterEmail !== undefined) payload.inviterEmail = body.inviterEmail;
    if (body.inviterAvatar !== undefined) payload.inviterAvatar = body.inviterAvatar;
    if (body.inviterRole !== undefined) payload.inviterRole = body.inviterRole;
    if (body.inviteeName !== undefined) payload.inviteeName = body.inviteeName;
    if (body.inviteeEmail !== undefined) payload.inviteeEmail = body.inviteeEmail;
    if (body.inviteeAvatar !== undefined) payload.inviteeAvatar = body.inviteeAvatar;
    if (body.inviteeRole !== undefined) payload.inviteeRole = body.inviteeRole;

    if (typeof body.topic === 'string' && body.topic.trim().length > 0) {
      payload.topic = body.topic.trim();
    }
    if (typeof body.message === 'string' && body.message.trim().length > 0) {
      payload.message = body.message.trim();
    }

    const docRef = await db.collection('mockInterviews').add(payload);
    res.status(201).json({ id: docRef.id, ...payload });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to create session' });
  }
};

export const updateSessionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const sessionId = getString(req.params.sessionId, 'sessionId');
    const body = req.body as UpdateSessionStatusBody;
    const allowedStatuses: InterviewSessionDocument['status'][] = [
      'pending',
      'accepted',
      'confirmed',
      'declined',
      'completed',
      'cancelled',
    ];

    if (!allowedStatuses.includes(body.status)) {
      throw new ApiError(400, 'Invalid status');
    }

    const ref = db.collection('mockInterviews').doc(sessionId);
    const sessionDoc = await ref.get();
    if (!sessionDoc.exists) {
      throw new ApiError(404, 'Session not found');
    }
    const session = sessionDoc.data() as InterviewSessionDocument;
    if (session.inviterId !== user.uid && session.inviteeId !== user.uid) {
      throw new ApiError(403, 'Forbidden');
    }

    await ref.set({ status: body.status, updatedAt: new Date().toISOString() }, { merge: true });
    res.status(200).json({ message: 'Session updated' });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to update session' });
  }
};

export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const sessionId = getString(req.params.sessionId, 'sessionId');
    const body = req.body as FeedbackBody;
    const revieweeId = getString(body.revieweeId, 'revieweeId');
    const notes = getString(body.notes, 'notes');
    const now = new Date().toISOString();

    const payload: FeedbackDocument = {
      sessionId,
      reviewerId: user.uid,
      revieweeId,
      notes,
      tags: Array.isArray(body.tags) ? body.tags.filter((tag) => typeof tag === 'string') : [],
      scores: body.scores,
      createdAt: now,
    };

    const feedbackRef = await db.collection('mockInterviews').doc(sessionId).collection('feedback').add(payload);
    await db.collection('mockInterviews').doc(sessionId).set(
      {
        feedbackStatus: 'submitted',
        updatedAt: now,
      },
      { merge: true },
    );

    res.status(201).json({ id: feedbackRef.id, ...payload });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};

export const getMyFeedbackForSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const sessionId = getString(req.params.sessionId, 'sessionId');
    const snapshot = await db
      .collection('mockInterviews')
      .doc(sessionId)
      .collection('feedback')
      .where('reviewerId', '==', user.uid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(200).json(null);
      return;
    }

    const feedbackDoc = snapshot.docs[0];
    if (!feedbackDoc) {
      res.status(200).json(null);
      return;
    }
    res.status(200).json({ id: feedbackDoc.id, ...feedbackDoc.data() });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to load feedback' });
  }
};

export const deleteMyFeedbackForSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const sessionId = getString(req.params.sessionId, 'sessionId');
    const feedbackRef = db.collection('mockInterviews').doc(sessionId).collection('feedback');
    const snapshot = await feedbackRef.where('reviewerId', '==', user.uid).get();
    const batch = db.batch();
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    batch.set(
      db.collection('mockInterviews').doc(sessionId),
      {
        feedbackStatus: 'pending',
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    await batch.commit();
    res.status(200).json({ message: 'Feedback deleted' });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to delete feedback' });
  }
};

export const updateSessionNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const sessionId = getString(req.params.sessionId, 'sessionId');
    const notes = getString((req.body as Record<string, unknown>).notes, 'notes');
    const sessionRef = db.collection('mockInterviews').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
      throw new ApiError(404, 'Session not found');
    }
    const session = sessionDoc.data() as InterviewSessionDocument;
    if (session.inviterId !== user.uid && session.inviteeId !== user.uid) {
      throw new ApiError(403, 'Forbidden');
    }
    await sessionRef.set(
      {
        notesPrivate: notes,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    res.status(200).json({ message: 'Notes updated' });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to update notes' });
  }
};

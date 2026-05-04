import type { Request, Response } from 'express';
import { db, firestoreAdmin } from '../config/firebase';
import type { ConversationDocument, MessageDocument } from '../types/models';
import { ApiError } from '../utils/api-error';
import { getString, requireUser } from '../utils/request';

export const listConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const snapshot = await db
      .collection('dmThreads')
      .where('participants', 'array-contains', user.uid)
      .get();
      
    let conversations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{ id: string } & ConversationDocument>;

    conversations = conversations.filter(
      (d) => !(d.hiddenFor || []).includes(user.uid)
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.status(200).json(conversations);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

export const ensureConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const body = req.body as { id?: string; name: string; avatar?: string };
    const recipientName = getString(body.name, 'name');
    const recipientId = body.id || null;
    
    if (recipientId === user.uid) {
      throw new ApiError(400, 'Cannot start a conversation with your own account');
    }

    const recipientKey = recipientId || recipientName.toLowerCase().replace(/\s+/g, '-');

    const snapshot = await db
      .collection('dmThreads')
      .where('participants', 'array-contains', user.uid)
      .get();
      
    const existing = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Array<{ id: string } & ConversationDocument>;
    
    const existingConversation = existing.find((conversation) => {
      if (recipientId) {
        return (
          conversation.recipientId === recipientId ||
          conversation.recipientKey === recipientId
        );
      }
      return (
        conversation.recipientKey === recipientKey ||
        conversation.recipientName === recipientName
      );
    });

    if (existingConversation) {
      res.status(200).json(existingConversation);
      return;
    }

    const createdAt = new Date().toISOString();
    
    const userDoc = await db.collection('users').doc(user.uid).get();
    const currentName = userDoc.exists ? String(userDoc.data()?.name ?? 'User') : 'User';
    const currentAvatar = userDoc.exists ? String(userDoc.data()?.photo_url ?? currentName.charAt(0)) : currentName.charAt(0);
    
    const currentUserProfile = {
      name: currentName,
      avatar: currentAvatar,
      email: user.email || '',
    };
    
    const recipientProfile = {
      name: recipientName,
      avatar: body.avatar || recipientName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
      email: '',
    };
    
    const payload: ConversationDocument = {
      participants: [user.uid, recipientKey],
      recipientKey,
      recipientId,
      recipientName,
      recipientAvatar: recipientProfile.avatar,
      createdById: user.uid,
      createdByName: currentUserProfile.name,
      createdByAvatar: currentUserProfile.avatar,
      participantProfiles: {
        [user.uid]: currentUserProfile,
        [recipientKey]: recipientProfile,
      },
      lastMessage: '',
      createdAt,
      updatedAt: createdAt,
      unreadCounts: {
        [user.uid]: 0,
        [recipientKey]: 0,
      },
      blockedBy: [],
      hiddenFor: [],
    };

    const docRef = await db.collection('dmThreads').add(payload);
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
    res.status(500).json({ message: 'Failed to create conversation' });
  }
};

export const listMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const conversationId = getString(req.params.conversationId, 'conversationId');
    
    const convDoc = await db.collection('dmThreads').doc(conversationId).get();
    if (!convDoc.exists) throw new ApiError(404, 'Conversation not found');
    
    const convData = convDoc.data() as ConversationDocument;
    if (!convData.participants.includes(user.uid)) {
      throw new ApiError(403, 'Forbidden');
    }

    const snapshot = await db
      .collection('dmThreads')
      .doc(conversationId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .get();
      
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(messages);
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const conversationId = getString(req.params.conversationId, 'conversationId');
    const text = getString((req.body as any).text, 'text');
    
    const convRef = db.collection('dmThreads').doc(conversationId);
    const convDoc = await convRef.get();
    if (!convDoc.exists) throw new ApiError(404, 'Conversation not found');
    
    const convData = convDoc.data() as ConversationDocument;
    if (!convData.participants.includes(user.uid)) {
      throw new ApiError(403, 'Forbidden');
    }

    const now = new Date().toISOString();
    const messagePayload: MessageDocument = {
      conversationId,
      senderId: user.uid,
      text,
      readBy: [user.uid],
      createdAt: now,
    };

    const newUnreadCounts = { ...convData.unreadCounts };
    convData.participants.forEach((p) => {
      if (p !== user.uid) {
        newUnreadCounts[p] = (newUnreadCounts[p] || 0) + 1;
      }
    });

    const batch = db.batch();
    const msgRef = convRef.collection('messages').doc();
    batch.set(msgRef, messagePayload);
    
    batch.set(convRef, {
      lastMessage: text,
      updatedAt: now,
      hiddenFor: [],
      unreadCounts: newUnreadCounts,
    }, { merge: true });

    await batch.commit();

    res.status(201).json({ id: msgRef.id, ...messagePayload });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to send message' });
  }
};

export const markRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const conversationId = getString(req.params.conversationId, 'conversationId');
    
    const convRef = db.collection('dmThreads').doc(conversationId);
    const convDoc = await convRef.get();
    if (!convDoc.exists) throw new ApiError(404, 'Conversation not found');
    
    const convData = convDoc.data() as ConversationDocument;
    if (!convData.participants.includes(user.uid)) {
      throw new ApiError(403, 'Forbidden');
    }

    if ((convData.unreadCounts?.[user.uid] ?? 0) > 0) {
      await convRef.set({
        unreadCounts: {
          ...convData.unreadCounts,
          [user.uid]: 0,
        }
      }, { merge: true });
    }

    res.status(200).json({ message: 'Marked as read' });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to mark as read' });
  }
};

import type { Request, Response } from 'express';
import { db } from '../config/firebase';
import type { GroupDocument } from '../types/models';
import { ApiError } from '../utils/api-error';
import { getString, requireUser } from '../utils/request';

const normalizeGroup = (id: string, data: any): GroupDocument => ({
  id,
  name: data.name || '',
  description: data.description || '',
  ownerId: data.ownerId || '',
  members: data.members || [],
  memberIds: data.memberIds || [],
  memberProfiles: data.memberProfiles || {},
  memberCount: data.memberCount || 0,
  blockedMembers: data.blockedMembers || [],
  blockedMemberIds: data.blockedMemberIds || [],
  visibility: data.visibility || 'Private',
  tags: data.tags || [],
  rules: data.rules || [],
  coverImage: data.coverImage || null,
  maxMembers: data.maxMembers || 5,
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || data.createdAt || new Date().toISOString(),
});

export const getGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const memberSnap = await db.collection('groups').where('memberIds', 'array-contains', user.uid).get();
    const ownerSnap = await db.collection('groups').where('ownerId', '==', user.uid).get();

    const allGroups = [...memberSnap.docs, ...ownerSnap.docs].map(d => normalizeGroup(d.id, d.data()));
    
    // Deduplicate
    const deduped = Array.from(new Map(allGroups.map(g => [g.id, g])).values());

    res.status(200).json(deduped);
  } catch (error: unknown) {
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
};

export const getGroupById = async (req: Request, res: Response): Promise<void> => {
  try {
    const groupId = getString(req.params.groupId, 'groupId');
    const doc = await db.collection('groups').doc(groupId).get();
    if (!doc.exists) throw new ApiError(404, 'Group not found');
    res.status(200).json(normalizeGroup(doc.id, doc.data()));
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to fetch group' });
  }
};

export const createGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const body = req.body as Partial<GroupDocument>;
    
    const userDoc = await db.collection('users').doc(user.uid).get();
    const currentName = String(userDoc.data()?.name || 'User');
    const currentAvatar = String(userDoc.data()?.photo_url || currentName.charAt(0));

    const newGroup = {
      ...body,
      ownerId: user.uid,
      visibility: 'Private',
      members: [currentName],
      memberIds: [user.uid],
      memberProfiles: {
        [user.uid]: {
          name: currentName,
          avatar: currentAvatar,
          email: user.email || '',
          role: 'Owner',
        },
      },
      memberCount: 1,
      blockedMembers: [],
      blockedMemberIds: [],
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('groups').add(newGroup);
    res.status(201).json(normalizeGroup(docRef.id, newGroup));
  } catch (error: unknown) {
    res.status(500).json({ message: 'Failed to create group' });
  }
};

export const updateGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const groupId = getString(req.params.groupId, 'groupId');
    const updates = req.body;
    
    const docRef = db.collection('groups').doc(groupId);
    const snap = await docRef.get();
    if (!snap.exists) throw new ApiError(404, 'Group not found');
    
    const group = snap.data() as GroupDocument;
    if (group.ownerId !== user.uid) {
      throw new ApiError(403, 'Only the group owner can update this group');
    }

    const sanitizedUpdates = { ...updates, visibility: 'Private' };
    await docRef.set(sanitizedUpdates, { merge: true });

    res.status(200).json(normalizeGroup(docRef.id, { ...group, ...sanitizedUpdates }));
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to update group' });
  }
};

export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const groupId = getString(req.params.groupId, 'groupId');
    
    const docRef = db.collection('groups').doc(groupId);
    const snap = await docRef.get();
    if (!snap.exists) throw new ApiError(404, 'Group not found');
    
    const group = snap.data() as GroupDocument;
    if (group.ownerId !== user.uid) {
      throw new ApiError(403, 'Only the group owner can delete this group');
    }

    await docRef.delete();
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to delete group' });
  }
};

export const acceptGroupInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { inviteId } = req.body;
    if (!inviteId) throw new ApiError(400, 'inviteId is required');

    const inviteSnap = await db.collection('groupInvites').doc(inviteId).get();
    if (!inviteSnap.exists) throw new ApiError(404, 'Invite not found');

    const invite = inviteSnap.data() as any;
    if (invite.status !== 'active') throw new ApiError(400, 'Invite is no longer active');

    const groupRef = db.collection('groups').doc(invite.groupId);
    const groupSnap = await groupRef.get();
    if (!groupSnap.exists) throw new ApiError(404, 'Group not found');

    const groupData = groupSnap.data();
    if (!groupData) throw new ApiError(404, 'Group data is empty');
    const group = normalizeGroup(groupSnap.id, groupData);

    // Verify inviter is still the owner
    if (invite.inviterId !== group.ownerId) {
      throw new ApiError(400, 'This invite is no longer valid (owner changed)');
    }

    // Build member profile
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data() || {};
    const memberProfile = {
      name: userData.name || user.email?.split('@')[0] || 'User',
      avatar: userData.photo_url || (userData.name ? userData.name.charAt(0) : 'U'),
      email: user.email || '',
      role: user.uid === group.ownerId ? 'Owner' : 'Member',
    };

    // Check if blocked
    const isBlocked = (group.blockedMemberIds || []).includes(user.uid) || 
                      (group.blockedMembers || []).includes(memberProfile.name);
    if (isBlocked) throw new ApiError(403, 'You are blocked from this group');

    // Check if full
    const existingMemberIds = group.memberIds || [];
    if (!existingMemberIds.includes(user.uid) && group.maxMembers && existingMemberIds.length >= group.maxMembers) {
      throw new ApiError(400, 'This group is already full');
    }

    // Update group
    const updatedMembers = Array.from(new Set([...(group.members || []), memberProfile.name]));
    const updatedMemberIds = Array.from(new Set([...existingMemberIds, user.uid]));
    const updatedMemberProfiles = {
      ...(group.memberProfiles || {}),
      [user.uid]: memberProfile,
    };

    await groupRef.update({
      members: updatedMembers,
      memberIds: updatedMemberIds,
      memberProfiles: updatedMemberProfiles,
      memberCount: updatedMembers.length,
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json(normalizeGroup(groupRef.id, {
      ...group,
      members: updatedMembers,
      memberIds: updatedMemberIds,
      memberProfiles: updatedMemberProfiles,
      memberCount: updatedMembers.length,
    }));
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to accept group invite' });
  }
};

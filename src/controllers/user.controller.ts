import type { Request, Response } from 'express';
import { db } from '../config/firebase';
import type { UserProfile } from '../types/models';
import { ApiError } from '../utils/api-error';
import { getString, requireUser } from '../utils/request';

const nowIso = (): string => new Date().toISOString();

const calculateProfileCompletion = (profile: UserProfile): number => {
  let score = 0;
  if (profile.first_name && profile.last_name) score += 10;
  if (profile.photo_url) score += 15;
  if (profile.headline) score += 5;
  if (profile.bio) score += 5;
  if (profile.current_role) score += 5;
  if (profile.location) score += 2;
  if (profile.experience_level) score += 8;
  if (Array.isArray(profile.skills) && profile.skills.length > 0) score += 20;
  if (profile.target_role) score += 5;
  if (profile.resume_url || profile.linkedin_url || profile.github_url || profile.portfolio_url) score += 5;
  if (profile.is_available_for_interview) score += 2;
  if (profile.timezone) score += 3;
  if (Array.isArray(profile.availability) && profile.availability.length > 0) score += 5;
  if (Array.isArray(profile.interview_focus) && profile.interview_focus.length > 0) score += 5;
  if (profile.email_verified) score += 5;
  return Math.min(100, Math.round(score));
};

const getEligibility = (profile: UserProfile): { eligible: boolean; missing: string[] } => {
  const missing: string[] = [];
  if (!profile.first_name) missing.push('Name (First Name)');
  if (!Array.isArray(profile.skills) || profile.skills.length === 0) missing.push('At least 1 Skill');
  if (!profile.target_role) missing.push('Target Role');
  if (!profile.is_available_for_interview) missing.push('Availability Toggle ON');
  if (!profile.timezone) missing.push('Timezone');
  if (!Array.isArray(profile.availability) || profile.availability.length === 0) missing.push('At least 1 Availability Slot');
  
  // Relaxed for MVP: email_verified and last_name are no longer strictly required for eligibility
  // if (!profile.email_verified) missing.push('Email Verification');
  
  if ((profile.profile_completion_percentage || 0) < 40) missing.push('Profile Completion >= 40%');
  return { eligible: missing.length === 0, missing };
};

const buildDefaultProfile = (uid: string, email: string): UserProfile => {
  const timestamp = nowIso();
  const firstName = email.split('@')[0] || '';
  const profile: UserProfile = {
    uid,
    email,
    first_name: firstName,
    last_name: '',
    display_name: firstName,
    skills: [],
    target_role: '',
    is_available_for_interview: false,
    timezone: '',
    availability: [],
    email_verified: false,
    profile_completion_percentage: 0,
    connected_accounts: {},
    notification_preferences: {
      email: { interview_invites: true, session_reminders: true },
      in_app: { interview_invite: true, reminder: true },
    },
    is_public: 'public',
    show_skills_publicly: true,
    show_progress_publicly: true,
    allow_direct_messages: 'everyone',
    who_can_invite_me: 'everyone',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  profile.profile_completion_percentage = calculateProfileCompletion(profile);
  const eligibility = getEligibility(profile);
  profile.invite_eligible = eligibility.eligible;
  profile.invite_eligibility_missing = eligibility.missing;
  return profile;
};

const normalizeProfile = (raw: UserProfile): UserProfile => {
  const normalized = { ...raw };
  normalized.profile_completion_percentage = calculateProfileCompletion(normalized);
  const eligibility = getEligibility(normalized);
  normalized.invite_eligible = eligibility.eligible;
  normalized.invite_eligibility_missing = eligibility.missing;
  return normalized;
};

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = requireUser(req);
    const userDoc = await db.collection('users').doc(currentUser.uid).get();

    if (!userDoc.exists) {
      const created = buildDefaultProfile(currentUser.uid, currentUser.email);
      await db.collection('users').doc(currentUser.uid).set(created, { merge: true });
      res.status(200).json(created);
      return;
    }

    const profile = normalizeProfile(userDoc.data() as UserProfile);
    await db.collection('users').doc(currentUser.uid).set(
      {
        profile_completion_percentage: profile.profile_completion_percentage,
        invite_eligible: profile.invite_eligible,
        invite_eligibility_missing: profile.invite_eligibility_missing,
        updatedAt: nowIso(),
      },
      { merge: true },
    );
    res.status(200).json(profile);
  } catch (error: unknown) {
    console.error('Error in getMyProfile:', error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to load profile' });
  }
};

export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = requireUser(req);
    const currentProfileDoc = await db.collection('users').doc(currentUser.uid).get();
    const existing = currentProfileDoc.exists
      ? (currentProfileDoc.data() as UserProfile)
      : buildDefaultProfile(currentUser.uid, currentUser.email);
    const updates = req.body as Partial<UserProfile>;

    const merged: UserProfile = {
      ...existing,
      ...updates,
      uid: currentUser.uid,
      email: existing.email || currentUser.email,
      updatedAt: nowIso(),
    };
    const normalized = normalizeProfile(merged);
    await db.collection('users').doc(currentUser.uid).set(normalized, { merge: true });
    res.status(200).json(normalized);
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

export const getMyInviteEligibility = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = requireUser(req);
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const profile = userDoc.exists
      ? normalizeProfile(userDoc.data() as UserProfile)
      : buildDefaultProfile(currentUser.uid, currentUser.email);
    const eligibility = getEligibility(profile);
    res.status(200).json(eligibility);
  } catch (error: unknown) {
    console.error('Error in getMyInviteEligibility:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to load invite eligibility' });
  }
};

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const eligibleOnly = req.query.eligibleOnly === 'true';

    let query: FirebaseFirestore.Query = db.collection('users');
    if (eligibleOnly) {
      query = query.where('is_available_for_interview', '==', true);
    }


    const snapshot = await query.get();
    let users = snapshot.docs
      .filter((doc) => doc.id !== user.uid)
      .map((doc) => normalizeProfile(doc.data() as UserProfile));

    if (eligibleOnly) {
      users = users.filter((u) => u.invite_eligible);
    }

    res.status(200).json(users);
  } catch (error: unknown) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    requireUser(req);
    const userId = getString(req.params.userId, 'userId');
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) {
      throw new ApiError(404, 'User not found');
    }
    res.status(200).json(normalizeProfile(doc.data() as UserProfile));
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

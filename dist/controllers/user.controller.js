"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.listUsers = exports.getMyInviteEligibility = exports.updateMyProfile = exports.getMyProfile = void 0;
const firebase_1 = require("../config/firebase");
const api_error_1 = require("../utils/api-error");
const request_1 = require("../utils/request");
const nowIso = () => new Date().toISOString();
const calculateProfileCompletion = (profile) => {
    let score = 0;
    if (profile.first_name && profile.last_name)
        score += 10;
    if (profile.photo_url)
        score += 15;
    if (profile.headline)
        score += 5;
    if (profile.bio)
        score += 5;
    if (profile.current_role)
        score += 5;
    if (profile.location)
        score += 2;
    if (profile.experience_level)
        score += 8;
    if (Array.isArray(profile.skills) && profile.skills.length > 0)
        score += 20;
    if (profile.target_role)
        score += 5;
    if (profile.resume_url || profile.linkedin_url || profile.github_url || profile.portfolio_url)
        score += 5;
    if (profile.is_available_for_interview)
        score += 2;
    if (profile.timezone)
        score += 3;
    if (Array.isArray(profile.availability) && profile.availability.length > 0)
        score += 5;
    if (Array.isArray(profile.interview_focus) && profile.interview_focus.length > 0)
        score += 5;
    if (profile.email_verified)
        score += 5;
    return Math.min(100, Math.round(score));
};
const getEligibility = (profile) => {
    const missing = [];
    if (!profile.first_name)
        missing.push('Name (First Name)');
    if (!Array.isArray(profile.skills) || profile.skills.length === 0)
        missing.push('At least 1 Skill');
    if (!profile.target_role)
        missing.push('Target Role');
    if (!profile.is_available_for_interview)
        missing.push('Availability Toggle ON');
    if (!profile.timezone)
        missing.push('Timezone');
    if (!Array.isArray(profile.availability) || profile.availability.length === 0)
        missing.push('At least 1 Availability Slot');
    // Relaxed for MVP: email_verified and last_name are no longer strictly required for eligibility
    // if (!profile.email_verified) missing.push('Email Verification');
    if ((profile.profile_completion_percentage || 0) < 40)
        missing.push('Profile Completion >= 40%');
    return { eligible: missing.length === 0, missing };
};
const buildDefaultProfile = (uid, email) => {
    const timestamp = nowIso();
    const firstName = email.split('@')[0] || '';
    const profile = {
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
const normalizeProfile = (raw) => {
    const normalized = { ...raw };
    normalized.profile_completion_percentage = calculateProfileCompletion(normalized);
    const eligibility = getEligibility(normalized);
    normalized.invite_eligible = eligibility.eligible;
    normalized.invite_eligibility_missing = eligibility.missing;
    return normalized;
};
const getMyProfile = async (req, res) => {
    try {
        const currentUser = (0, request_1.requireUser)(req);
        const userDoc = await firebase_1.db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists) {
            const created = buildDefaultProfile(currentUser.uid, currentUser.email);
            await firebase_1.db.collection('users').doc(currentUser.uid).set(created, { merge: true });
            res.status(200).json(created);
            return;
        }
        const profile = normalizeProfile(userDoc.data());
        await firebase_1.db.collection('users').doc(currentUser.uid).set({
            profile_completion_percentage: profile.profile_completion_percentage,
            invite_eligible: profile.invite_eligible,
            invite_eligibility_missing: profile.invite_eligibility_missing,
            updatedAt: nowIso(),
        }, { merge: true });
        res.status(200).json(profile);
    }
    catch (error) {
        console.error('Error in getMyProfile:', error);
        if (error instanceof api_error_1.ApiError) {
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
exports.getMyProfile = getMyProfile;
const updateMyProfile = async (req, res) => {
    try {
        const currentUser = (0, request_1.requireUser)(req);
        const currentProfileDoc = await firebase_1.db.collection('users').doc(currentUser.uid).get();
        const existing = currentProfileDoc.exists
            ? currentProfileDoc.data()
            : buildDefaultProfile(currentUser.uid, currentUser.email);
        const updates = req.body;
        const merged = {
            ...existing,
            ...updates,
            uid: currentUser.uid,
            email: existing.email || currentUser.email,
            updatedAt: nowIso(),
        };
        const normalized = normalizeProfile(merged);
        await firebase_1.db.collection('users').doc(currentUser.uid).set(normalized, { merge: true });
        res.status(200).json(normalized);
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
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
exports.updateMyProfile = updateMyProfile;
const getMyInviteEligibility = async (req, res) => {
    try {
        const currentUser = (0, request_1.requireUser)(req);
        const userDoc = await firebase_1.db.collection('users').doc(currentUser.uid).get();
        const profile = userDoc.exists
            ? normalizeProfile(userDoc.data())
            : buildDefaultProfile(currentUser.uid, currentUser.email);
        const eligibility = getEligibility(profile);
        res.status(200).json(eligibility);
    }
    catch (error) {
        console.error('Error in getMyInviteEligibility:', error);
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to load invite eligibility' });
    }
};
exports.getMyInviteEligibility = getMyInviteEligibility;
const listUsers = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const eligibleOnly = req.query.eligibleOnly === 'true';
        let query = firebase_1.db.collection('users');
        if (eligibleOnly) {
            query = query.where('is_available_for_interview', '==', true);
        }
        const snapshot = await query.get();
        let users = snapshot.docs
            .filter((doc) => doc.id !== user.uid)
            .map((doc) => normalizeProfile(doc.data()));
        if (eligibleOnly) {
            users = users.filter((u) => u.invite_eligible);
        }
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};
exports.listUsers = listUsers;
const getUserProfile = async (req, res) => {
    try {
        (0, request_1.requireUser)(req);
        const userId = (0, request_1.getString)(req.params.userId, 'userId');
        const doc = await firebase_1.db.collection('users').doc(userId).get();
        if (!doc.exists) {
            throw new api_error_1.ApiError(404, 'User not found');
        }
        res.status(200).json(normalizeProfile(doc.data()));
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to fetch user profile' });
    }
};
exports.getUserProfile = getUserProfile;
//# sourceMappingURL=user.controller.js.map
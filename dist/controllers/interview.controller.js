"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSessionNotes = exports.deleteMyFeedbackForSession = exports.getMyFeedbackForSession = exports.submitFeedback = exports.updateSessionStatus = exports.createSession = exports.listMySessions = void 0;
const firebase_1 = require("../config/firebase");
const api_error_1 = require("../utils/api-error");
const request_1 = require("../utils/request");
const listMySessions = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const asInviter = await firebase_1.db.collection('mockInterviews').where('inviterId', '==', user.uid).get();
        const asInvitee = await firebase_1.db.collection('mockInterviews').where('inviteeId', '==', user.uid).get();
        const merged = [...asInviter.docs, ...asInvitee.docs];
        const uniqueById = new Map();
        merged.forEach((doc) => {
            uniqueById.set(doc.id, { id: doc.id, ...doc.data() });
        });
        const sessions = [...uniqueById.values()].sort((a, b) => String(b.updatedAt ?? b.createdAt).localeCompare(String(a.updatedAt ?? a.createdAt)));
        res.status(200).json(sessions);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to list sessions' });
    }
};
exports.listMySessions = listMySessions;
const createSession = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const body = req.body;
        const inviteeId = (0, request_1.getString)(body.inviteeId, 'inviteeId');
        const proposedTimes = (0, request_1.getString)(body.proposedTimes, 'proposedTimes');
        const now = new Date().toISOString();
        const payload = {
            inviterId: user.uid,
            inviteeId,
            proposedTimes,
            meetingLink: (0, request_1.getString)(body.meetingLink, 'meetingLink'),
            status: 'pending',
            createdAt: now,
            updatedAt: now,
        };
        if (body.inviterName !== undefined)
            payload.inviterName = body.inviterName;
        if (body.inviterEmail !== undefined)
            payload.inviterEmail = body.inviterEmail;
        if (body.inviterAvatar !== undefined)
            payload.inviterAvatar = body.inviterAvatar;
        if (body.inviterRole !== undefined)
            payload.inviterRole = body.inviterRole;
        if (body.inviteeName !== undefined)
            payload.inviteeName = body.inviteeName;
        if (body.inviteeEmail !== undefined)
            payload.inviteeEmail = body.inviteeEmail;
        if (body.inviteeAvatar !== undefined)
            payload.inviteeAvatar = body.inviteeAvatar;
        if (body.inviteeRole !== undefined)
            payload.inviteeRole = body.inviteeRole;
        if (typeof body.topic === 'string' && body.topic.trim().length > 0) {
            payload.topic = body.topic.trim();
        }
        if (typeof body.message === 'string' && body.message.trim().length > 0) {
            payload.message = body.message.trim();
        }
        const docRef = await firebase_1.db.collection('mockInterviews').add(payload);
        res.status(201).json({ id: docRef.id, ...payload });
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
        res.status(500).json({ message: 'Failed to create session' });
    }
};
exports.createSession = createSession;
const updateSessionStatus = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const sessionId = (0, request_1.getString)(req.params.sessionId, 'sessionId');
        const body = req.body;
        const allowedStatuses = [
            'pending',
            'accepted',
            'confirmed',
            'declined',
            'completed',
            'cancelled',
        ];
        if (!allowedStatuses.includes(body.status)) {
            throw new api_error_1.ApiError(400, 'Invalid status');
        }
        const ref = firebase_1.db.collection('mockInterviews').doc(sessionId);
        const sessionDoc = await ref.get();
        if (!sessionDoc.exists) {
            throw new api_error_1.ApiError(404, 'Session not found');
        }
        const session = sessionDoc.data();
        if (session.inviterId !== user.uid && session.inviteeId !== user.uid) {
            throw new api_error_1.ApiError(403, 'Forbidden');
        }
        await ref.set({ status: body.status, updatedAt: new Date().toISOString() }, { merge: true });
        res.status(200).json({ message: 'Session updated' });
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
        res.status(500).json({ message: 'Failed to update session' });
    }
};
exports.updateSessionStatus = updateSessionStatus;
const submitFeedback = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const sessionId = (0, request_1.getString)(req.params.sessionId, 'sessionId');
        const body = req.body;
        const revieweeId = (0, request_1.getString)(body.revieweeId, 'revieweeId');
        const notes = (0, request_1.getString)(body.notes, 'notes');
        const now = new Date().toISOString();
        const payload = {
            sessionId,
            reviewerId: user.uid,
            revieweeId,
            notes,
            tags: Array.isArray(body.tags) ? body.tags.filter((tag) => typeof tag === 'string') : [],
            scores: body.scores,
            createdAt: now,
        };
        const feedbackRef = await firebase_1.db.collection('mockInterviews').doc(sessionId).collection('feedback').add(payload);
        await firebase_1.db.collection('mockInterviews').doc(sessionId).set({
            feedbackStatus: 'submitted',
            updatedAt: now,
        }, { merge: true });
        res.status(201).json({ id: feedbackRef.id, ...payload });
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
        res.status(500).json({ message: 'Failed to submit feedback' });
    }
};
exports.submitFeedback = submitFeedback;
const getMyFeedbackForSession = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const sessionId = (0, request_1.getString)(req.params.sessionId, 'sessionId');
        const snapshot = await firebase_1.db
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
        res.status(500).json({ message: 'Failed to load feedback' });
    }
};
exports.getMyFeedbackForSession = getMyFeedbackForSession;
const deleteMyFeedbackForSession = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const sessionId = (0, request_1.getString)(req.params.sessionId, 'sessionId');
        const feedbackRef = firebase_1.db.collection('mockInterviews').doc(sessionId).collection('feedback');
        const snapshot = await feedbackRef.where('reviewerId', '==', user.uid).get();
        const batch = firebase_1.db.batch();
        snapshot.docs.forEach((docSnap) => {
            batch.delete(docSnap.ref);
        });
        batch.set(firebase_1.db.collection('mockInterviews').doc(sessionId), {
            feedbackStatus: 'pending',
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        await batch.commit();
        res.status(200).json({ message: 'Feedback deleted' });
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
        res.status(500).json({ message: 'Failed to delete feedback' });
    }
};
exports.deleteMyFeedbackForSession = deleteMyFeedbackForSession;
const updateSessionNotes = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const sessionId = (0, request_1.getString)(req.params.sessionId, 'sessionId');
        const notes = (0, request_1.getString)(req.body.notes, 'notes');
        const sessionRef = firebase_1.db.collection('mockInterviews').doc(sessionId);
        const sessionDoc = await sessionRef.get();
        if (!sessionDoc.exists) {
            throw new api_error_1.ApiError(404, 'Session not found');
        }
        const session = sessionDoc.data();
        if (session.inviterId !== user.uid && session.inviteeId !== user.uid) {
            throw new api_error_1.ApiError(403, 'Forbidden');
        }
        await sessionRef.set({
            notesPrivate: notes,
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        res.status(200).json({ message: 'Notes updated' });
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
        res.status(500).json({ message: 'Failed to update notes' });
    }
};
exports.updateSessionNotes = updateSessionNotes;
//# sourceMappingURL=interview.controller.js.map
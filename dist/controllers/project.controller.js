"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.upsertProjectBoard = exports.getProjectBoard = exports.createProject = exports.listMyProjects = void 0;
const firebase_1 = require("../config/firebase");
const api_error_1 = require("../utils/api-error");
const request_1 = require("../utils/request");
const listMyProjects = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const snapshot = await firebase_1.db.collection('projects').where('memberIds', 'array-contains', user.uid).get();
        const projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(projects);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: 'Failed to fetch projects' });
    }
};
exports.listMyProjects = listMyProjects;
const createProject = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const body = req.body;
        const name = (0, request_1.getString)(body.name, 'name');
        const description = typeof body.description === 'string' ? body.description.trim() : '';
        const now = new Date().toISOString();
        const payload = {
            name,
            description,
            ownerId: user.uid,
            memberIds: [user.uid],
            visibility: body.visibility === 'Public' ? 'Public' : 'Private',
            createdAt: now,
            updatedAt: now,
        };
        const projectRef = await firebase_1.db.collection('projects').add(payload);
        res.status(201).json({ id: projectRef.id, ...payload });
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
        res.status(500).json({ message: 'Failed to create project' });
    }
};
exports.createProject = createProject;
const getProjectBoard = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const projectId = (0, request_1.getString)(req.params.projectId, 'projectId');
        const projectRef = firebase_1.db.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();
        if (!projectDoc.exists) {
            throw new api_error_1.ApiError(404, 'Project not found');
        }
        const projectData = projectDoc.data();
        if (!projectData.memberIds.includes(user.uid)) {
            throw new api_error_1.ApiError(403, 'Forbidden');
        }
        const boardSnapshot = await projectRef.collection('board').orderBy('position', 'asc').get();
        const tasks = boardSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(tasks);
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
        res.status(500).json({ message: 'Failed to load board' });
    }
};
exports.getProjectBoard = getProjectBoard;
const upsertProjectBoard = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const projectId = (0, request_1.getString)(req.params.projectId, 'projectId');
        const body = req.body;
        if (!Array.isArray(body.tasks)) {
            throw new api_error_1.ApiError(400, 'tasks must be an array');
        }
        const projectRef = firebase_1.db.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();
        if (!projectDoc.exists) {
            throw new api_error_1.ApiError(404, 'Project not found');
        }
        const projectData = projectDoc.data();
        if (!projectData.memberIds.includes(user.uid)) {
            throw new api_error_1.ApiError(403, 'Forbidden');
        }
        const batch = firebase_1.db.batch();
        body.tasks.forEach((task, index) => {
            if (!task?.id || !task.title || !task.status || !task.priority) {
                throw new api_error_1.ApiError(400, 'Invalid task payload');
            }
            const taskRef = projectRef.collection('board').doc(task.id);
            batch.set(taskRef, {
                ...task,
                position: typeof task.position === 'number' ? task.position : index,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        });
        batch.set(projectRef, { updatedAt: new Date().toISOString() }, { merge: true });
        await batch.commit();
        res.status(200).json({ message: 'Board updated successfully' });
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
        res.status(500).json({ message: 'Failed to update board' });
    }
};
exports.upsertProjectBoard = upsertProjectBoard;
const updateProject = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const projectId = (0, request_1.getString)(req.params.projectId, 'projectId');
        const body = req.body;
        const projectRef = firebase_1.db.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();
        if (!projectDoc.exists) {
            throw new api_error_1.ApiError(404, 'Project not found');
        }
        const projectData = projectDoc.data();
        if (projectData.ownerId !== user.uid && !projectData.memberIds.includes(user.uid)) {
            throw new api_error_1.ApiError(403, 'Forbidden');
        }
        const updates = {};
        if (typeof body.name === 'string' && body.name.trim().length > 0) {
            updates.name = body.name.trim();
        }
        if (typeof body.description === 'string') {
            updates.description = body.description.trim();
        }
        if (body.visibility === 'Public' || body.visibility === 'Private') {
            updates.visibility = body.visibility;
        }
        updates.updatedAt = new Date().toISOString();
        await projectRef.set(updates, { merge: true });
        res.status(200).json({ message: 'Project updated' });
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
        res.status(500).json({ message: 'Failed to update project' });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const projectId = (0, request_1.getString)(req.params.projectId, 'projectId');
        const projectRef = firebase_1.db.collection('projects').doc(projectId);
        const projectDoc = await projectRef.get();
        if (!projectDoc.exists) {
            throw new api_error_1.ApiError(404, 'Project not found');
        }
        const projectData = projectDoc.data();
        if (projectData.ownerId !== user.uid) {
            throw new api_error_1.ApiError(403, 'Only owner can delete project');
        }
        await projectRef.delete();
        res.status(200).json({ message: 'Project deleted' });
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
        res.status(500).json({ message: 'Failed to delete project' });
    }
};
exports.deleteProject = deleteProject;
//# sourceMappingURL=project.controller.js.map
import type { Request, Response } from 'express';
import { db } from '../config/firebase';
import type { ProjectDocument, ProjectTask } from '../types/models';
import { ApiError } from '../utils/api-error';
import { getString, requireUser } from '../utils/request';

interface CreateProjectBody {
  name: string;
  description: string;
  visibility?: 'Private' | 'Public';
}

interface UpdateBoardBody {
  tasks: ProjectTask[];
}

export const listMyProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const snapshot = await db.collection('projects').where('memberIds', 'array-contains', user.uid).get();
    const projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(projects);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const body = req.body as CreateProjectBody;
    const name = getString(body.name, 'name');
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const now = new Date().toISOString();

    const payload: ProjectDocument = {
      name,
      description,
      ownerId: user.uid,
      memberIds: [user.uid],
      visibility: body.visibility === 'Public' ? 'Public' : 'Private',
      createdAt: now,
      updatedAt: now,
    };

    const projectRef = await db.collection('projects').add(payload);
    res.status(201).json({ id: projectRef.id, ...payload });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
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

export const getProjectBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const projectId = getString(req.params.projectId, 'projectId');
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      throw new ApiError(404, 'Project not found');
    }

    const projectData = projectDoc.data() as ProjectDocument;
    if (!projectData.memberIds.includes(user.uid)) {
      throw new ApiError(403, 'Forbidden');
    }

    const boardSnapshot = await projectRef.collection('board').orderBy('position', 'asc').get();
    const tasks = boardSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(tasks);
  } catch (error: unknown) {
    if (error instanceof ApiError) {
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

export const upsertProjectBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const projectId = getString(req.params.projectId, 'projectId');
    const body = req.body as UpdateBoardBody;
    if (!Array.isArray(body.tasks)) {
      throw new ApiError(400, 'tasks must be an array');
    }

    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      throw new ApiError(404, 'Project not found');
    }
    const projectData = projectDoc.data() as ProjectDocument;
    if (!projectData.memberIds.includes(user.uid)) {
      throw new ApiError(403, 'Forbidden');
    }

    const batch = db.batch();
    body.tasks.forEach((task, index) => {
      if (!task?.id || !task.title || !task.status || !task.priority) {
        throw new ApiError(400, 'Invalid task payload');
      }
      const taskRef = projectRef.collection('board').doc(task.id);
      batch.set(
        taskRef,
        {
          ...task,
          position: typeof task.position === 'number' ? task.position : index,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    });

    batch.set(projectRef, { updatedAt: new Date().toISOString() }, { merge: true });
    await batch.commit();
    res.status(200).json({ message: 'Board updated successfully' });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
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

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const projectId = getString(req.params.projectId, 'projectId');
    const body = req.body as Partial<ProjectDocument>;
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      throw new ApiError(404, 'Project not found');
    }

    const projectData = projectDoc.data() as ProjectDocument;
    if (projectData.ownerId !== user.uid && !projectData.memberIds.includes(user.uid)) {
      throw new ApiError(403, 'Forbidden');
    }

    const updates: Partial<ProjectDocument> = {};
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
  } catch (error: unknown) {
    if (error instanceof ApiError) {
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

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const projectId = getString(req.params.projectId, 'projectId');
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      throw new ApiError(404, 'Project not found');
    }

    const projectData = projectDoc.data() as ProjectDocument;
    if (projectData.ownerId !== user.uid) {
      throw new ApiError(403, 'Only owner can delete project');
    }

    await projectRef.delete();
    res.status(200).json({ message: 'Project deleted' });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
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

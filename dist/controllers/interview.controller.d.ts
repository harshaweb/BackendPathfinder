import type { Request, Response } from 'express';
export declare const listMySessions: (req: Request, res: Response) => Promise<void>;
export declare const createSession: (req: Request, res: Response) => Promise<void>;
export declare const updateSessionStatus: (req: Request, res: Response) => Promise<void>;
export declare const submitFeedback: (req: Request, res: Response) => Promise<void>;
export declare const getMyFeedbackForSession: (req: Request, res: Response) => Promise<void>;
export declare const deleteMyFeedbackForSession: (req: Request, res: Response) => Promise<void>;
export declare const updateSessionNotes: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=interview.controller.d.ts.map
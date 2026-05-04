import type { Request, Response } from "express";
export declare const listPosts: (_req: Request, res: Response) => Promise<void>;
export declare const createPost: (req: Request, res: Response) => Promise<void>;
export declare const toggleLike: (req: Request, res: Response) => Promise<void>;
export declare const updatePost: (req: Request, res: Response) => Promise<void>;
export declare const deletePost: (req: Request, res: Response) => Promise<void>;
export declare const addComment: (req: Request, res: Response) => Promise<void>;
export declare const listComments: (req: Request, res: Response) => Promise<void>;
export declare const updateComment: (req: Request, res: Response) => Promise<void>;
export declare const deleteComment: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=post.controller.d.ts.map
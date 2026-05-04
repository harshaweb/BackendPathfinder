import type { Request } from 'express';
export declare const requireUser: (req: Request) => {
    uid: string;
    email: string;
};
export declare const getString: (value: unknown, fieldName: string) => string;
//# sourceMappingURL=request.d.ts.map
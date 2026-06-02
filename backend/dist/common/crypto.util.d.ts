export declare function hashPassword(password: string): string;
export declare function verifyPassword(password: string, storedPassword: string): boolean;
export declare function signJwt(payload: Record<string, any>, expiresInSeconds?: number): string;
export declare function verifyJwt(token: string): Record<string, any> | null;

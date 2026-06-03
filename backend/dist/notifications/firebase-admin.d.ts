import * as admin from 'firebase-admin';
export declare function initializeFirebaseAdmin(): admin.app.App | null;
export declare function sendFcmMessage(token: string, title: string, body: string, data?: Record<string, string>): Promise<string | {
    success: boolean;
    messageId: string;
}>;

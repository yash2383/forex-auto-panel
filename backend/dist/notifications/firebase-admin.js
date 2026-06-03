"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeFirebaseAdmin = initializeFirebaseAdmin;
exports.sendFcmMessage = sendFcmMessage;
const admin = __importStar(require("firebase-admin"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let firebaseAdminApp = null;
let isFirebaseInitialized = false;
function initializeFirebaseAdmin() {
    if (isFirebaseInitialized)
        return firebaseAdminApp;
    try {
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            firebaseAdminApp = admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
            isFirebaseInitialized = true;
            console.log('Firebase Admin SDK initialized successfully via applicationDefault credentials.');
            return firebaseAdminApp;
        }
        const defaultServiceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
        if (fs.existsSync(defaultServiceAccountPath)) {
            firebaseAdminApp = admin.initializeApp({
                credential: admin.credential.cert(defaultServiceAccountPath),
            });
            isFirebaseInitialized = true;
            console.log(`Firebase Admin SDK initialized successfully via cert at: ${defaultServiceAccountPath}`);
            return firebaseAdminApp;
        }
        console.warn('Firebase Service Account credentials not found. FCM will run in SIMULATION/DEV mode.');
    }
    catch (err) {
        console.error('Failed to initialize Firebase Admin SDK:', err.message);
    }
    return null;
}
async function sendFcmMessage(token, title, body, data = {}) {
    const app = initializeFirebaseAdmin();
    if (!app) {
        console.log(`[FCM SIMULATION] Send Push to: ${token.substring(0, 10)}... Title: "${title}", Body: "${body}"`);
        return { success: true, messageId: 'simulated-msg-id-' + Date.now() };
    }
    const cleanedData = {};
    for (const [key, val] of Object.entries(data)) {
        cleanedData[key] = String(val);
    }
    return admin.messaging(app).send({
        token,
        notification: {
            title,
            body,
        },
        data: cleanedData,
    });
}
//# sourceMappingURL=firebase-admin.js.map
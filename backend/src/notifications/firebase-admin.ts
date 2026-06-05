import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let firebaseAdminApp: admin.app.App | null = null;
let isFirebaseInitialized = false;

export function initializeFirebaseAdmin() {
  if (isFirebaseInitialized) return firebaseAdminApp;

  try {
    // 1. Check if GOOGLE_APPLICATION_CREDENTIALS env var is set
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      firebaseAdminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      isFirebaseInitialized = true;
      console.log(
        'Firebase Admin SDK initialized successfully via applicationDefault credentials.',
      );
      return firebaseAdminApp;
    }

    // 2. Check for firebase-service-account.json in the backend root directory
    const defaultServiceAccountPath = path.join(
      process.cwd(),
      'firebase-service-account.json',
    );
    if (fs.existsSync(defaultServiceAccountPath)) {
      firebaseAdminApp = admin.initializeApp({
        credential: admin.credential.cert(defaultServiceAccountPath),
      });
      isFirebaseInitialized = true;
      console.log(
        `Firebase Admin SDK initialized successfully via cert at: ${defaultServiceAccountPath}`,
      );
      return firebaseAdminApp;
    }

    // 3. Fallback: FCM will run in SIMULATION/DEV mode
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Firebase credentials are missing in production! Place firebase-service-account.json in the backend root or set GOOGLE_APPLICATION_CREDENTIALS.',
      );
    }

    console.warn(
      'Firebase Service Account credentials not found. FCM will run in SIMULATION/DEV mode.',
    );
  } catch (err: any) {
    console.error('Failed to initialize Firebase Admin SDK:', err.message);
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
  }

  return null;
}

export async function verifyFirebaseCredentials(app: admin.app.App) {
  // Dry-run send to a validation topic to test credentials with Firebase API
  await admin.messaging(app).send(
    {
      topic: 'dry-run-validation',
      notification: {
        title: 'Dry-run validation',
        body: 'Validating credentials on boot',
      },
    },
    true, // dryRun = true
  );
}

export async function sendFcmMessage(
  token: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
) {
  const app = initializeFirebaseAdmin();

  if (!app) {
    console.log(
      `[FCM SIMULATION] Send Push to: ${token.substring(0, 10)}... Title: "${title}", Body: "${body}"`,
    );
    return { success: true, messageId: 'simulated-msg-id-' + Date.now() };
  }

  // Clean data keys to ensure they are all strings (FCM requirement)
  const cleanedData: Record<string, string> = {};
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

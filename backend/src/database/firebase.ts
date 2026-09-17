import { applicationDefault, cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from '../config/env';

function readServiceAccount(): ServiceAccount | undefined {
  if (env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount;
  }
  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }
  return undefined;
}

if (getApps().length === 0) {
  const account = readServiceAccount();
  initializeApp({ credential: account ? cert(account) : applicationDefault() });
}

export const firebaseAuth = getAuth();

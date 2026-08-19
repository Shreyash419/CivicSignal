import * as functions from 'firebase-functions';
import { app } from './app';

// Export Express app as a Firebase Cloud Function named 'api'
export const api = functions.https.onRequest(app);

// Re-export all Firebase resources and authentication utilities
export * from './firebaseAuth';
export { app, auth, db, firebaseConfig, isFirebaseConfigured } from './firebaseAuth';
import { app } from './firebaseAuth';
export default app;


import { getApp, getApps, initializeApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_CLEVEL_API_KEY,
  authDomain: import.meta.env.VITE_CLEVEL_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_CLEVEL_PROJECT_ID,
  storageBucket: import.meta.env.VITE_CLEVEL_STORAGE_BUCKET,
  databaseURL: import.meta.env.VITE_CLEVEL_DATABASE_URL,
  messagingSenderId: import.meta.env.VITE_CLEVEL_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_CLEVEL_APP_ID,
};

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

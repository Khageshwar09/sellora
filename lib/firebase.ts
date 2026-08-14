import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Sellora Firebase configuration
const firebaseConfig = {
  apiKey:"AIzaSyDtHlhlOH98CKy9NCM08HT03kMn7l10bSg",
  authDomain: "sellora-a9b6c.firebaseapp.com",
  projectId: "sellora-a9b6c",
  storageBucket: "sellora-a9b6c.firebasestorage.app",
  messagingSenderId: "367833665499",
  appId: "1:367833665499:web:2d0482737384f89cffa1fe",
};

// Prevent Firebase from being initialized multiple times
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
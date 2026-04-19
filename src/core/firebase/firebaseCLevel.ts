import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseApp } from "./firebaseApp";

export const authCLevel = getAuth(firebaseApp);
export const DIREKSI_DATABASE_NAME = "direksi";
export const dbCLevel = getFirestore(firebaseApp, DIREKSI_DATABASE_NAME);
export const storageCLevel = getStorage(firebaseApp);

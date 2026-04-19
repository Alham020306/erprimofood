import { getFirestore } from "firebase/firestore";
import { firebaseApp } from "./firebaseApp";

// database operasional lama (default)
export const dbMain = getFirestore(firebaseApp);
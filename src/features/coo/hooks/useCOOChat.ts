import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

type Params = {
  user: any;
};

export const useCOOChat = ({ user }: Params) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(dbCLevel, "director_chat_rooms", "coo-main", "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("COO chat error:", error);
        setMessages([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    const safeText = text.trim();
    if (!safeText) return;

    try {
      await addDoc(
        collection(dbCLevel, "director_chat_rooms", "coo-main", "messages"),
        {
          senderId: user?.uid ?? "-",
          senderName: user?.fullName ?? "Unknown",
          senderRole: user?.primaryRole ?? "COO",
          text: safeText,
          createdAt: serverTimestamp(),
        }
      );

      setText("");
    } catch (error) {
      console.error("send COO chat error:", error);
    }
  };

  return {
    loading,
    messages,
    text,
    setText,
    sendMessage,
  };
};
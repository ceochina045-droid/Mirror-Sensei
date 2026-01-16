
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc,
  orderBy,
  limit
} from "firebase/firestore";
import { AdminPrompt, LevelPrompt, HistoryItem, Category, Level } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyDCq97GmqK_wxMOrjLasErr84dFR_0fS94",
  authDomain: "mirror-sensei.firebaseapp.com",
  projectId: "mirror-sensei",
  storageBucket: "mirror-sensei.firebasestorage.app",
  messagingSenderId: "125849822127",
  appId: "1:125849822127:web:862f6ff539afb97f5f855a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const saveAdminPrompt = async (category: Category, subCategory: string, prompt: string) => {
  const id = `${category}_${subCategory}`.replace(/\s+/g, '_');
  await setDoc(doc(db, "adminPrompts", id), {
    category,
    subCategory,
    prompt,
    updatedAt: Date.now()
  });
};

export const getAdminPrompts = async (): Promise<AdminPrompt[]> => {
  const querySnapshot = await getDocs(collection(db, "adminPrompts"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminPrompt));
};

export const saveLevelPrompt = async (level: Level, prompt: string) => {
  const id = level.replace(/\s+/g, '_');
  await setDoc(doc(db, "levelPrompts", id), {
    level,
    prompt,
    updatedAt: Date.now()
  });
};

export const getLevelPrompts = async (): Promise<LevelPrompt[]> => {
  const querySnapshot = await getDocs(collection(db, "levelPrompts"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LevelPrompt));
};

export const saveHistory = async (history: Omit<HistoryItem, 'id'>) => {
  await addDoc(collection(db, "history"), {
    ...history,
    timestamp: Date.now()
  });
};

export const getHistory = async (search?: string): Promise<HistoryItem[]> => {
  const historyRef = collection(db, "history");
  const q = query(historyRef, orderBy("timestamp", "desc"), limit(20));
  const querySnapshot = await getDocs(q);
  const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HistoryItem));
  
  if (search) {
    return items.filter(item => 
      item.query.toLowerCase().includes(search.toLowerCase()) || 
      item.response.toLowerCase().includes(search.toLowerCase())
    );
  }
  return items;
};

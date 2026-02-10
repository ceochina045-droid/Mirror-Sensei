import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, query, where, writeBatch } from 'firebase/firestore';

// Firebase configuration - using environment variables or placeholder
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKey",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "edutrack.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "edutrack-project",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "edutrack.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Simple database wrapper
class LocalDB {
  private data: Map<string, any[]> = new Map();

  get<T>(collectionName: string): T[] {
    return this.data.get(collectionName) || [];
  }

  save(collectionName: string, data: any[]): void {
    this.data.set(collectionName, data);
  }

  addItem<T>(collectionName: string, item: T): void {
    const items = this.data.get(collectionName) || [];
    items.push(item);
    this.data.set(collectionName, items);
  }

  updateItem<T>(collectionName: string, index: number, item: T): void {
    const items = this.data.get(collectionName) || [];
    if (index >= 0 && index < items.length) {
      items[index] = item;
      this.data.set(collectionName, items);
    }
  }

  deleteItem(collectionName: string, index: number): void {
    const items = this.data.get(collectionName) || [];
    if (index >= 0 && index < items.length) {
      items.splice(index, 1);
      this.data.set(collectionName, items);
    }
  }
}

// Create a local database instance
export const db = new LocalDB();

export { app, firestore };

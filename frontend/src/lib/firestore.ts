import { db } from "./firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  increment, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit 
} from "firebase/firestore";

export interface UserProfile {
  displayName?: string;
  role?: string;
  company?: string;
  bio?: string;
  avatarDataUrl?: string;
  analysesRun: number;
  decksCreated: number;
}

export interface ChatHistoryEntry {
  id?: string;
  query: string;
  summary: string;
  chartType: string;
  filePath: string | null;
  success: boolean;
  timestamp: number;
}

// Helper to check if Firebase is configured properly
const isFirebaseConfigured = () => {
  return process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
         process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "mock-api-key-reportwise-ai";
};

// ─── USER PROFILE ────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<Partial<UserProfile> | null> {
  if (!isFirebaseConfigured()) {
    return getLocalUserProfile(uid);
  }
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Partial<UserProfile>;
    }
    return getLocalUserProfile(uid); // Fallback to local if doc not found
  } catch (error) {
    console.warn("Firestore error, falling back to localStorage:", error);
    return getLocalUserProfile(uid);
  }
}

export async function saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<boolean> {
  saveLocalUserProfile(uid, profile);
  if (!isFirebaseConfigured()) {
    return true;
  }
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, profile, { merge: true });
    return true;
  } catch (error) {
    console.warn("Firestore save failed, saved to localStorage:", error);
    return true; // Return true because it is saved locally
  }
}

export async function incrementProfileStat(uid: string, statName: string): Promise<void> {
  incrementLocalProfileStat(uid, statName);
  if (!isFirebaseConfigured()) {
    return;
  }
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, { [statName]: increment(1) }, { merge: true });
  } catch (error) {
    console.warn("Firestore increment failed, updated locally:", error);
  }
}

// ─── CHAT HISTORY ────────────────────────────────────────────────────────────

export async function saveChatHistory(uid: string, chat: any): Promise<void> {
  saveLocalChatHistory(uid, chat);
  if (!isFirebaseConfigured()) {
    return;
  }
  try {
    const chatRef = collection(db, "users", uid, "chatHistory");
    await addDoc(chatRef, {
      ...chat,
      timestamp: Date.now()
    });
  } catch (error) {
    console.warn("Firestore save chat history failed, saved locally:", error);
  }
}

export async function getChatHistory(uid: string): Promise<ChatHistoryEntry[]> {
  if (!isFirebaseConfigured()) {
    return getLocalChatHistory(uid);
  }
  try {
    const chatRef = collection(db, "users", uid, "chatHistory");
    const q = query(chatRef, orderBy("timestamp", "desc"), limit(20));
    const querySnapshot = await getDocs(q);
    const history: ChatHistoryEntry[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      history.push({
        id: docSnap.id,
        query: data.query || "",
        summary: data.summary || "",
        chartType: data.chartType || "",
        filePath: data.filePath || null,
        success: !!data.success,
        timestamp: data.timestamp || Date.now()
      });
    });
    return history;
  } catch (error) {
    console.warn("Firestore get chat history failed, reading from localStorage:", error);
    return getLocalChatHistory(uid);
  }
}

// ─── LOCAL STORAGE FALLBACK IMPLEMENTATIONS ──────────────────────────────────

function getLocalUserProfile(uid: string): Partial<UserProfile> {
  if (typeof window === "undefined") return {};
  try {
    const key = `user_profile_${uid}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    
    // Default initial profile
    const defaultProfile: UserProfile = {
      analysesRun: 0,
      decksCreated: 0,
      displayName: "",
      role: "Data Analyst",
      company: "",
      bio: ""
    };
    localStorage.setItem(key, JSON.stringify(defaultProfile));
    return defaultProfile;
  } catch {
    return {};
  }
}

function saveLocalUserProfile(uid: string, profile: Partial<UserProfile>) {
  if (typeof window === "undefined") return;
  try {
    const key = `user_profile_${uid}`;
    const current = getLocalUserProfile(uid);
    const updated = { ...current, ...profile };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error("Local storage save failed:", e);
  }
}

function incrementLocalProfileStat(uid: string, statName: string) {
  if (typeof window === "undefined") return;
  try {
    const key = `user_profile_${uid}`;
    const current = getLocalUserProfile(uid);
    const currentVal = (current as any)[statName] || 0;
    const updated = { ...current, [statName]: currentVal + 1 };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error("Local storage stat increment failed:", e);
  }
}

function getLocalChatHistory(uid: string): ChatHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const key = `chat_history_${uid}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalChatHistory(uid: string, chat: any) {
  if (typeof window === "undefined") return;
  try {
    const key = `chat_history_${uid}`;
    const history = getLocalChatHistory(uid);
    const newEntry: ChatHistoryEntry = {
      id: Math.random().toString(36).substring(7),
      query: chat.query || "",
      summary: chat.summary || "",
      chartType: chat.chartType || "",
      filePath: chat.filePath || null,
      success: !!chat.success,
      timestamp: Date.now()
    };
    history.unshift(newEntry);
    localStorage.setItem(key, JSON.stringify(history.slice(0, 50))); // Keep last 50
  } catch (e) {
    console.error("Local storage save chat history failed:", e);
  }
}

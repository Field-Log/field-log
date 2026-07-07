import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db as firestore } from "../config/firebase";
import { fetchItems, type Item } from "./database";

function userCol(uid: string, colName: string) {
  return collection(firestore, "users", uid, colName);
}

function userDoc(uid: string, colName: string, docId: string) {
  return doc(firestore, "users", uid, colName, docId);
}

// Push a single item to Firestore
export async function syncItem(uid: string, item: Item): Promise<void> {
  await setDoc(userDoc(uid, "items", item.id), {
    ...item,
    // gallery URIs are local paths — skip syncing them for now
    gallery: [],
    cover_photo: null,
    is_private: isCustomType(item.item_type),
    synced_at: serverTimestamp(),
  });
}

// Delete a single item from Firestore
export async function deleteSyncedItem(
  uid: string,
  itemId: string,
): Promise<void> {
  await deleteDoc(userDoc(uid, "items", itemId));
}

// On first sign-in, upload all local items to Firestore
export async function uploadAllItems(uid: string): Promise<void> {
  const items = await fetchItems();
  if (items.length === 0) return;

  const batch = writeBatch(firestore);
  for (const item of items) {
    const ref = userDoc(uid, "items", item.id);
    batch.set(ref, {
      ...item,
      gallery: [],
      cover_photo: null,
      is_private: isCustomType(item.item_type),
      synced_at: serverTimestamp(),
    });
  }
  await batch.commit();
}

// On sign-in with existing account, fetch items from Firestore
// (used when switching devices — local DB would be empty)
export async function downloadAllItems(
  uid: string,
): Promise<Record<string, unknown>[]> {
  const snap = await getDocs(userCol(uid, "items"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Custom types (not in the 23 predefined types) are private by default
const PREDEFINED_TYPES = new Set([
  "fountain_pen",
  "ballpoint_pen",
  "pencil",
  "ink",
  "notebook",
  "knife",
  "multitool",
  "tool",
  "flashlight",
  "watch",
  "wallet",
  "key_organizer",
  "bag",
  "fidget",
  "electronics",
  "audio",
  "camera",
  "lens",
  "optic",
  "medical_kit",
  "outdoor_gear",
  "clothing",
  "consumable",
]);

export function isCustomType(itemType: string): boolean {
  return !PREDEFINED_TYPES.has(itemType);
}

// Sync a log entry
export async function syncLogEntry(
  uid: string,
  entry: {
    id: string;
    item_id: string;
    item_type: string;
    entry_type: string;
    entry_date: string;
    notes: string | null;
    condition: string | null;
    created_at: string;
  },
): Promise<void> {
  await setDoc(userDoc(uid, "log_entries", entry.id), {
    ...entry,
    synced_at: serverTimestamp(),
  });
}

export async function deleteSyncedLogEntry(
  uid: string,
  entryId: string,
): Promise<void> {
  await deleteDoc(userDoc(uid, "log_entries", entryId));
}

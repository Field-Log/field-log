import { loggerMessages } from "@package/logger";
import {
  collection,
  type DocumentData,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db as firestore } from "../config/firebase";
import { logger } from "../lib/logger";
import {
  fetchAllLogEntries,
  fetchItemById,
  fetchItems,
  fetchLogEntryById,
  type Item,
  type LogEntry,
  type LogEntryType,
  type SpecValue,
  upsertRestoredItem,
  upsertRestoredLogEntry,
} from "./database";

function userCol(uid: string, colName: string) {
  return collection(firestore, "users", uid, colName);
}

function userDoc(uid: string, colName: string, docId: string) {
  return doc(firestore, "users", uid, colName, docId);
}

let currentSyncUserId: string | null = null;

export function setCurrentSyncUserId(uid: string | null): void {
  currentSyncUserId = uid;
}

function currentUserId(): string | null {
  return currentSyncUserId;
}

function logSyncFailure(operation: string, error: unknown): void {
  logger.warn(loggerMessages.mobile.syncUploadFailed, {
    attributes: {
      operation,
      reason: "local_data_remains_source_of_truth",
    },
    error,
  });
}

function runBestEffort(operation: string, task: () => Promise<void>): void {
  task().catch((error: unknown) => logSyncFailure(operation, error));
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function numericFlag(value: unknown): number {
  if (typeof value === "number") return value ? 1 : 0;
  if (typeof value === "boolean") return value ? 1 : 0;
  return 0;
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

function specsValue(value: unknown): Record<string, SpecValue> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, SpecValue>;
  }

  return {};
}

const logEntryTypes = new Set<LogEntryType>([
  "carried",
  "maintenance",
  "note",
  "ink_change",
  "config_change",
]);

function logEntryType(value: unknown): LogEntryType {
  return typeof value === "string" && logEntryTypes.has(value as LogEntryType)
    ? (value as LogEntryType)
    : "note";
}

function normalizeSyncedItem(id: string, data: DocumentData): Item {
  const now = new Date().toISOString();

  return {
    id,
    item_type: stringValue(data.item_type, "unknown"),
    name: nullableString(data.name),
    manufacturer: nullableString(data.manufacturer),
    model: nullableString(data.model),
    variant: nullableString(data.variant),
    nickname: nullableString(data.nickname),
    serial_number: nullableString(data.serial_number),
    status: stringValue(data.status, "own"),
    purchase_date: nullableString(data.purchase_date),
    purchase_price: nullableNumber(data.purchase_price),
    current_value: nullableNumber(data.current_value),
    seller: nullableString(data.seller),
    warranty: nullableString(data.warranty),
    material: nullableString(data.material),
    finish: nullableString(data.finish),
    color: nullableString(data.color),
    weight_g: nullableNumber(data.weight_g),
    dimensions: nullableString(data.dimensions),
    storage_location: nullableString(data.storage_location),
    is_favorite: numericFlag(data.is_favorite),
    is_carried: numericFlag(data.is_carried),
    cover_photo: nullableString(data.cover_photo),
    gallery: stringArray(data.gallery),
    notes: nullableString(data.notes),
    specs: specsValue(data.specs),
    created_at: stringValue(data.created_at, now),
    updated_at: stringValue(data.updated_at, now),
  };
}

function normalizeSyncedLogEntry(id: string, data: DocumentData): LogEntry {
  const now = new Date().toISOString();

  return {
    id,
    item_id: stringValue(data.item_id, ""),
    item_type: stringValue(data.item_type, "unknown"),
    entry_type: logEntryType(data.entry_type),
    entry_date: stringValue(data.entry_date, now.slice(0, 10)),
    notes: nullableString(data.notes),
    condition: nullableString(data.condition),
    created_at: stringValue(data.created_at, now),
  };
}

// Push a single item to Firestore.
export async function syncItem(uid: string, item: Item): Promise<void> {
  await setDoc(userDoc(uid, "items", item.id), {
    ...item,
    // gallery URIs are local paths; keep the cloud copy portable.
    gallery: [],
    cover_photo: null,
    is_private: isCustomType(item.item_type),
    synced_at: serverTimestamp(),
  });
}

// Delete a single item and its logs from Firestore.
export async function deleteSyncedItem(
  uid: string,
  itemId: string,
): Promise<void> {
  const batch = writeBatch(firestore);
  batch.delete(userDoc(uid, "items", itemId));

  const logSnapshot = await getDocs(
    query(userCol(uid, "log_entries"), where("item_id", "==", itemId)),
  );
  for (const logDoc of logSnapshot.docs) {
    batch.delete(logDoc.ref);
  }

  await batch.commit();
}

export async function syncLogEntry(
  uid: string,
  entry: LogEntry,
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

export async function uploadAllData(uid: string): Promise<void> {
  await uploadAllItems(uid);

  const logEntries = await fetchAllLogEntries();
  if (logEntries.length === 0) return;

  const batch = writeBatch(firestore);
  for (const entry of logEntries) {
    batch.set(userDoc(uid, "log_entries", entry.id), {
      ...entry,
      synced_at: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function downloadAllItems(uid: string): Promise<Item[]> {
  const snap = await getDocs(userCol(uid, "items"));
  return snap.docs.map((itemDoc) =>
    normalizeSyncedItem(itemDoc.id, itemDoc.data()),
  );
}

export async function downloadAllLogEntries(uid: string): Promise<LogEntry[]> {
  const snap = await getDocs(userCol(uid, "log_entries"));
  return snap.docs
    .map((entryDoc) => normalizeSyncedLogEntry(entryDoc.id, entryDoc.data()))
    .filter((entry) => entry.item_id.length > 0);
}

export async function restoreAllData(uid: string): Promise<void> {
  const [items, logEntries] = await Promise.all([
    downloadAllItems(uid),
    downloadAllLogEntries(uid),
  ]);

  for (const item of items) {
    await upsertRestoredItem(item);
  }

  for (const entry of logEntries) {
    await upsertRestoredLogEntry(entry);
  }
}

export function syncCurrentUserDataBestEffort(uid: string): void {
  runBestEffort("initial_user_data_sync", async () => {
    const localItems = await fetchItems();
    if (localItems.length === 0) {
      await restoreAllData(uid);
      return;
    }

    await uploadAllData(uid);
  });
}

export function syncCurrentUserItemBestEffort(itemId: string): void {
  const uid = currentUserId();
  if (!uid) return;

  runBestEffort("item_upsert", async () => {
    const item = await fetchItemById(itemId);
    if (item) await syncItem(uid, item);
  });
}

export function deleteSyncedCurrentUserItemBestEffort(itemId: string): void {
  const uid = currentUserId();
  if (!uid) return;

  runBestEffort("item_delete", async () => {
    await deleteSyncedItem(uid, itemId);
  });
}

export function syncCurrentUserLogEntryBestEffort(entryId: string): void {
  const uid = currentUserId();
  if (!uid) return;

  runBestEffort("log_entry_upsert", async () => {
    const entry = await fetchLogEntryById(entryId);
    if (entry) await syncLogEntry(uid, entry);
  });
}

export function deleteSyncedCurrentUserLogEntryBestEffort(
  entryId: string,
): void {
  const uid = currentUserId();
  if (!uid) return;

  runBestEffort("log_entry_delete", async () => {
    await deleteSyncedLogEntry(uid, entryId);
  });
}

// Custom types (not in the predefined types) are private by default.
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

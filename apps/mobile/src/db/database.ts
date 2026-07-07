import * as SQLite from "expo-sqlite";

const dbPromise = SQLite.openDatabaseAsync("fieldlog.db");

const db = {
  async execAsync(source: string): Promise<void> {
    const database = await dbPromise;
    await database.execAsync(source);
  },
  async getAllAsync<T>(
    source: string,
    params: SQLite.SQLiteBindParams = [],
  ): Promise<T[]> {
    const database = await dbPromise;
    return await database.getAllAsync<T>(source, params);
  },
  async getFirstAsync<T>(
    source: string,
    params: SQLite.SQLiteBindParams = [],
  ): Promise<T | null> {
    const database = await dbPromise;
    return await database.getFirstAsync<T>(source, params);
  },
  async runAsync(
    source: string,
    params: SQLite.SQLiteBindParams = [],
  ): Promise<SQLite.SQLiteRunResult> {
    const database = await dbPromise;
    return await database.runAsync(source, params);
  },
};

export type SpecValue =
  | boolean
  | null
  | number
  | string
  | SpecValue[]
  | { [key: string]: SpecValue };

export type LogEntryType =
  | "carried"
  | "maintenance"
  | "note"
  | "ink_change"
  | "config_change";

export type Item = {
  id: string;
  item_type: string;
  name: string | null;
  manufacturer: string | null;
  model: string | null;
  variant: string | null;
  nickname: string | null;
  serial_number: string | null;
  status: string;
  purchase_date: string | null;
  purchase_price: number | null;
  current_value: number | null;
  seller: string | null;
  warranty: string | null;
  material: string | null;
  finish: string | null;
  color: string | null;
  weight_g: number | null;
  dimensions: string | null;
  storage_location: string | null;
  is_favorite: number;
  is_carried: number;
  cover_photo: string | null;
  gallery: string[];
  notes: string | null;
  specs: Record<string, SpecValue>;
  created_at: string;
  updated_at: string;
};

export type ItemInsert = Omit<
  Item,
  "created_at" | "updated_at" | "gallery" | "specs"
> & {
  gallery?: string[];
  specs?: Record<string, SpecValue>;
};

type ItemRow = Omit<Item, "gallery" | "specs"> & {
  gallery: string | null;
  specs: string | null;
};

type CollectionRow = {
  description: string | null;
  id: string;
  name: string;
};

type IdNameRow = {
  id: string;
  name: string;
};

type MostCarriedRow = {
  days_carried: number;
  item_id: string;
  item_type: string;
};

const SCHEMA_VERSION = "2";

export async function initDatabase(): Promise<void> {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS db_meta (key TEXT PRIMARY KEY, value TEXT);`,
  );

  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM db_meta WHERE key = 'schema_version';`,
  );

  if (!row || row.value !== SCHEMA_VERSION) {
    await db.execAsync(`
      DROP TABLE IF EXISTS fountain_pens;
      DROP TABLE IF EXISTS machined_pens;
      DROP TABLE IF EXISTS log_entries;
      DROP TABLE IF EXISTS items;
      DROP TABLE IF EXISTS collections;
      DROP TABLE IF EXISTS item_collections;
      DROP TABLE IF EXISTS tags;
      DROP TABLE IF EXISTS item_tags;

      CREATE TABLE items (
        id TEXT PRIMARY KEY NOT NULL,
        item_type TEXT NOT NULL,
        name TEXT,
        manufacturer TEXT,
        model TEXT,
        variant TEXT,
        nickname TEXT,
        serial_number TEXT,
        status TEXT DEFAULT 'own' CHECK (status IN ('own','sold','lost','gifted','wishlist')),
        purchase_date TEXT,
        purchase_price REAL,
        current_value REAL,
        seller TEXT,
        warranty TEXT,
        material TEXT,
        finish TEXT,
        color TEXT,
        weight_g REAL,
        dimensions TEXT,
        storage_location TEXT,
        is_favorite INTEGER DEFAULT 0,
        is_carried INTEGER DEFAULT 0,
        cover_photo TEXT,
        gallery TEXT DEFAULT '[]',
        notes TEXT,
        specs TEXT DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE collections (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE item_collections (
        item_id TEXT NOT NULL,
        collection_id TEXT NOT NULL,
        PRIMARY KEY (item_id, collection_id)
      );

      CREATE TABLE tags (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      );

      CREATE TABLE item_tags (
        item_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (item_id, tag_id)
      );

      CREATE TABLE log_entries (
        id TEXT PRIMARY KEY NOT NULL,
        item_id TEXT NOT NULL,
        item_type TEXT NOT NULL,
        entry_type TEXT NOT NULL CHECK (entry_type IN ('carried','maintenance','note','ink_change','config_change')),
        entry_date TEXT NOT NULL,
        notes TEXT,
        condition TEXT,
        created_at TEXT NOT NULL
      );

      INSERT OR REPLACE INTO db_meta (key, value) VALUES ('schema_version', '2');
    `);
  }
}

/* ============================================================
   ITEM FUNCTIONS
   ============================================================ */

function parseJsonRecord(value: string | null): Record<string, SpecValue> {
  if (!value) return {};

  const parsed = JSON.parse(value) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, SpecValue>)
    : {};
}

function parseStringArray(value: string | null): string[] {
  if (!value) return [];

  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === "string")
    : [];
}

function parseItem(row: ItemRow): Item {
  return {
    ...row,
    gallery: parseStringArray(row.gallery),
    specs: parseJsonRecord(row.specs),
  };
}

export async function insertItem(data: ItemInsert): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO items (
      id, item_type, name, manufacturer, model, variant, nickname, serial_number,
      status, purchase_date, purchase_price, current_value, seller, warranty,
      material, finish, color, weight_g, dimensions, storage_location,
      is_favorite, is_carried, cover_photo, gallery, notes, specs,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      data.id,
      data.item_type,
      data.name ?? null,
      data.manufacturer ?? null,
      data.model ?? null,
      data.variant ?? null,
      data.nickname ?? null,
      data.serial_number ?? null,
      data.status ?? "own",
      data.purchase_date ?? null,
      data.purchase_price ?? null,
      data.current_value ?? null,
      data.seller ?? null,
      data.warranty ?? null,
      data.material ?? null,
      data.finish ?? null,
      data.color ?? null,
      data.weight_g ?? null,
      data.dimensions ?? null,
      data.storage_location ?? null,
      data.is_favorite ?? 0,
      data.is_carried ?? 0,
      data.cover_photo ?? null,
      JSON.stringify(data.gallery ?? []),
      data.notes ?? null,
      JSON.stringify(data.specs ?? {}),
      now,
      now,
    ],
  );
}

export async function updateItem(
  id: string,
  data: Partial<ItemInsert>,
): Promise<void> {
  const now = new Date().toISOString();
  const entries = Object.entries(data);
  if (entries.length === 0) return;

  const setClauses = entries.map(([k]) => `${k} = ?`).join(", ");
  const values: (string | number | null)[] = entries.map(([k, v]) => {
    if (k === "gallery") return JSON.stringify(v ?? []);
    if (k === "specs") return JSON.stringify(v ?? {});
    if (v === undefined) return null;
    if (typeof v === "boolean") return v ? 1 : 0;
    return v as string | number | null;
  });

  await db.runAsync(
    `UPDATE items SET ${setClauses}, updated_at = ? WHERE id = ?;`,
    [...values, now, id],
  );
}

export async function deleteItem(id: string): Promise<void> {
  await db.runAsync(`DELETE FROM item_collections WHERE item_id = ?;`, [id]);
  await db.runAsync(`DELETE FROM item_tags WHERE item_id = ?;`, [id]);
  await db.runAsync(`DELETE FROM log_entries WHERE item_id = ?;`, [id]);
  await db.runAsync(`DELETE FROM items WHERE id = ?;`, [id]);
}

export async function fetchItems(filters?: {
  item_type?: string;
}): Promise<Item[]> {
  let query = `SELECT * FROM items`;
  const params: string[] = [];
  if (filters?.item_type) {
    query += ` WHERE item_type = ?`;
    params.push(filters.item_type);
  }
  query += ` ORDER BY manufacturer, model;`;
  const rows = await db.getAllAsync<ItemRow>(query, params);
  return rows.map(parseItem);
}

export async function fetchItemById(id: string): Promise<Item | undefined> {
  const rows = await db.getAllAsync<ItemRow>(
    `SELECT * FROM items WHERE id = ? LIMIT 1;`,
    [id],
  );
  const first = rows[0];
  return first ? parseItem(first) : undefined;
}

/* ============================================================
   COLLECTION FUNCTIONS
   ============================================================ */

export async function insertCollection(
  name: string,
  description?: string,
): Promise<string> {
  const id = Date.now().toString();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO collections (id, name, description, created_at) VALUES (?, ?, ?, ?);`,
    [id, name, description ?? null, now],
  );
  return id;
}

export async function fetchCollections(): Promise<
  { id: string; name: string; description: string | null }[]
> {
  return await db.getAllAsync<CollectionRow>(
    `SELECT id, name, description FROM collections ORDER BY name;`,
  );
}

export async function addItemToCollection(
  itemId: string,
  collectionId: string,
): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO item_collections (item_id, collection_id) VALUES (?, ?);`,
    [itemId, collectionId],
  );
}

export async function removeItemFromCollection(
  itemId: string,
  collectionId: string,
): Promise<void> {
  await db.runAsync(
    `DELETE FROM item_collections WHERE item_id = ? AND collection_id = ?;`,
    [itemId, collectionId],
  );
}

export async function fetchCollectionsForItem(
  itemId: string,
): Promise<{ id: string; name: string }[]> {
  return await db.getAllAsync<IdNameRow>(
    `SELECT c.id, c.name FROM collections c
     JOIN item_collections ic ON ic.collection_id = c.id
     WHERE ic.item_id = ? ORDER BY c.name;`,
    [itemId],
  );
}

export async function fetchItemIdsInCollection(
  collectionId: string,
): Promise<string[]> {
  const rows = (await db.getAllAsync(
    `SELECT item_id FROM item_collections WHERE collection_id = ?;`,
    [collectionId],
  )) as { item_id: string }[];
  return rows.map((r) => r.item_id);
}

export async function deleteCollection(id: string): Promise<void> {
  await db.runAsync(`DELETE FROM item_collections WHERE collection_id = ?;`, [
    id,
  ]);
  await db.runAsync(`DELETE FROM collections WHERE id = ?;`, [id]);
}

/* ============================================================
   TAG FUNCTIONS
   ============================================================ */

export async function upsertTag(name: string): Promise<string> {
  const existing = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM tags WHERE name = ? LIMIT 1;`,
    [name],
  );
  const first = existing[0];
  if (first) return first.id;
  const id = Date.now().toString();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO tags (id, name, created_at) VALUES (?, ?, ?);`,
    [id, name, now],
  );
  return id;
}

export async function addTagToItem(
  itemId: string,
  tagId: string,
): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?);`,
    [itemId, tagId],
  );
}

export async function removeTagFromItem(
  itemId: string,
  tagId: string,
): Promise<void> {
  await db.runAsync(`DELETE FROM item_tags WHERE item_id = ? AND tag_id = ?;`, [
    itemId,
    tagId,
  ]);
}

export async function fetchTagsForItem(
  itemId: string,
): Promise<{ id: string; name: string }[]> {
  return await db.getAllAsync<IdNameRow>(
    `SELECT t.id, t.name FROM tags t
     JOIN item_tags it ON it.tag_id = t.id
     WHERE it.item_id = ? ORDER BY t.name;`,
    [itemId],
  );
}

export async function fetchAllTags(): Promise<{ id: string; name: string }[]> {
  return await db.getAllAsync<IdNameRow>(
    `SELECT id, name FROM tags ORDER BY name;`,
  );
}

export async function fetchItemIdsForTag(tagId: string): Promise<string[]> {
  const rows = (await db.getAllAsync(
    `SELECT item_id FROM item_tags WHERE tag_id = ?;`,
    [tagId],
  )) as { item_id: string }[];
  return rows.map((r) => r.item_id);
}

/* ============================================================
   LOG ENTRY FUNCTIONS
   ============================================================ */

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export async function insertLogEntry(
  id: string,
  itemId: string,
  notes?: string,
  condition?: string,
  options?: {
    itemType?: string;
    entryType?: LogEntryType;
    entryDate?: string;
  },
): Promise<void> {
  const itemType = options?.itemType ?? "unknown";
  const entryType = options?.entryType ?? "note";
  const entryDate = options?.entryDate ?? todayString();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO log_entries (id, item_id, item_type, entry_type, entry_date, notes, condition, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      itemId,
      itemType,
      entryType,
      entryDate,
      notes ?? null,
      condition ?? null,
      createdAt,
    ],
  );
}

export async function toggleCarried(
  itemId: string,
  itemType: string,
  entryDate: string,
): Promise<boolean> {
  const existing = (await db.getAllAsync(
    `SELECT id FROM log_entries WHERE item_id = ? AND item_type = ? AND entry_type = 'carried' AND entry_date = ? LIMIT 1;`,
    [itemId, itemType, entryDate],
  )) as { id: string }[];

  if (existing.length > 0) {
    const carriedEntry = existing[0];
    if (!carriedEntry) return true;
    await db.runAsync(`DELETE FROM log_entries WHERE id = ?;`, [
      carriedEntry.id,
    ]);
    return false;
  } else {
    const id = `${itemId}_${entryDate}_carried`;
    const createdAt = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO log_entries (id, item_id, item_type, entry_type, entry_date, notes, condition, created_at)
       VALUES (?, ?, ?, 'carried', ?, NULL, NULL, ?);`,
      [id, itemId, itemType, entryDate, createdAt],
    );
    return true;
  }
}

export async function fetchCarriedItemIdsForDate(
  entryDate: string,
): Promise<{ item_id: string; item_type: string }[]> {
  return (await db.getAllAsync(
    `SELECT item_id, item_type FROM log_entries WHERE entry_type = 'carried' AND entry_date = ?;`,
    [entryDate],
  )) as { item_id: string; item_type: string }[];
}

export async function fetchLogEntriesForItem(
  itemId: string,
  itemType: string,
): Promise<
  {
    id: string;
    entry_type: LogEntryType;
    entry_date: string;
    notes: string | null;
    condition: string | null;
    created_at: string;
  }[]
> {
  return await db.getAllAsync<{
    condition: string | null;
    created_at: string;
    entry_date: string;
    entry_type: LogEntryType;
    id: string;
    notes: string | null;
  }>(
    `SELECT id, entry_type, entry_date, notes, condition, created_at
     FROM log_entries
     WHERE item_id = ? AND item_type = ? AND entry_type != 'carried'
     ORDER BY entry_date DESC, created_at DESC;`,
    [itemId, itemType],
  );
}

export async function fetchInkStats(): Promise<
  { ink: string; count: number }[]
> {
  return (await db.getAllAsync(
    `SELECT notes as ink, COUNT(*) as count
     FROM log_entries
     WHERE entry_type = 'ink_change' AND notes IS NOT NULL AND notes != ''
     GROUP BY notes
     ORDER BY count DESC;`,
  )) as { ink: string; count: number }[];
}

export async function fetchCarryDatesForItem(
  itemId: string,
): Promise<string[]> {
  const rows = (await db.getAllAsync(
    `SELECT DISTINCT entry_date FROM log_entries WHERE item_id = ? AND entry_type = 'carried' ORDER BY entry_date;`,
    [itemId],
  )) as { entry_date: string }[];
  return rows.map((r) => r.entry_date);
}

export async function fetchMostCarried(options?: {
  sinceDate?: string;
}): Promise<{ item_id: string; item_type: string; days_carried: number }[]> {
  if (options?.sinceDate) {
    return await db.getAllAsync<MostCarriedRow>(
      `SELECT item_id, item_type, COUNT(DISTINCT entry_date) as days_carried
       FROM log_entries
       WHERE entry_type = 'carried' AND entry_date >= ?
       GROUP BY item_id, item_type
       ORDER BY days_carried DESC;`,
      [options.sinceDate],
    );
  }
  return await db.getAllAsync<MostCarriedRow>(
    `SELECT item_id, item_type, COUNT(DISTINCT entry_date) as days_carried
     FROM log_entries
     WHERE entry_type = 'carried'
     GROUP BY item_id, item_type
     ORDER BY days_carried DESC;`,
  );
}

export default db;

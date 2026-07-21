import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type AutmogPenImageRecord = {
  altText: string | null;
  height: number | null;
  position: number;
  sourceHash: string;
  sourceImageId: string | null;
  sourceUrl: string;
  width: number | null;
};

export type AutmogPenNormalizedData = {
  availableForSale: boolean;
  bodyDetails: string[];
  bodyShape: string | null;
  category: string | null;
  clip: string | null;
  finish: string | null;
  grip: string | null;
  imageSetHash: string;
  images: AutmogPenImageRecord[];
  materials: string[];
  mechanism: string | null;
  nose: string | null;
  priceMaxCents: number | null;
  priceMinCents: number | null;
  productUrl: string;
  refill: string | null;
  size: string | null;
  title: string;
  variants: unknown[];
};

export type ScraperRunStats = {
  archivedCount?: number;
  deadLetterFailedImageJobs?: number;
  deadLetterFailedItemJobs?: number;
  deadLetterRequeueFailedImageJobs?: number;
  deadLetterRequeueFailedItemJobs?: number;
  deadLetterRequeuedImageJobs?: number;
  deadLetterRequeuedItemJobs?: number;
  enqueuedImageJobs?: number;
  enqueuedItemJobs?: number;
  failedImageJobs?: number;
  failedItemJobs?: number;
  fetchedCount?: number;
  processedImageJobs?: number;
  processedItemJobs?: number;
  skippedImageJobs?: number;
  updatedCount?: number;
};

export const makers = pgTable(
  "makers",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity({ startWith: 1000 }),
    name: text("name").notNull(),
    rootUrl: text("root_url").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    rootUrlUnique: uniqueIndex("makers_root_url_unique").on(table.rootUrl),
  }),
);

export const scraperRuns = pgTable(
  "scraper_runs",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity({ startWith: 1000 }),
    source: text("source").notNull(),
    jobType: text("job_type").notNull(),
    status: text("status").notNull(),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp("finished_at", { mode: "date", withTimezone: true }),
    heartbeatAt: timestamp("heartbeat_at", {
      mode: "date",
      withTimezone: true,
    }),
    errorMessage: text("error_message"),
    stats: jsonb("stats")
      .$type<ScraperRunStats>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
  },
  (table) => ({
    sourceJobStatusIdx: index("scraper_runs_source_job_status_idx").on(
      table.source,
      table.jobType,
      table.status,
    ),
    startedAtIdx: index("scraper_runs_started_at_idx").on(table.startedAt),
  }),
);

export const materials = pgTable(
  "materials",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity({ startWith: 1000 }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nameUnique: uniqueIndex("materials_name_unique").on(table.name),
    slugUnique: uniqueIndex("materials_slug_unique").on(table.slug),
  }),
);

export const mechanisms = pgTable(
  "mechanisms",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity({ startWith: 1000 }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nameUnique: uniqueIndex("mechanisms_name_unique").on(table.name),
    slugUnique: uniqueIndex("mechanisms_slug_unique").on(table.slug),
  }),
);

export const productTypes = pgTable(
  "product_types",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity({ startWith: 1000 }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    nameUnique: uniqueIndex("product_types_name_unique").on(table.name),
    slugUnique: uniqueIndex("product_types_slug_unique").on(table.slug),
  }),
);

export const tmpAutmogPens = pgTable(
  "tmp_autmog_pens",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity({ startWith: 1000 }),
    makerId: bigint("maker_id", { mode: "number" })
      .notNull()
      .references(() => makers.id, { onDelete: "restrict" }),
    mechanismId: bigint("mechanism_id", { mode: "number" }).references(
      () => mechanisms.id,
      { onDelete: "restrict" },
    ),
    sourceProductId: text("source_product_id").notNull(),
    sourceHandle: text("source_handle").notNull(),
    title: text("title").notNull(),
    productUrl: text("product_url").notNull(),
    description: text("description"),
    size: text("size"),
    refill: text("refill"),
    nose: text("nose"),
    clip: text("clip"),
    grip: text("grip"),
    finish: text("finish"),
    bodyDetails: jsonb("body_details")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    tags: jsonb("tags").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
    variants: jsonb("variants")
      .$type<unknown[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    normalizedData: jsonb("normalized_data")
      .$type<AutmogPenNormalizedData>()
      .notNull(),
    detailsHash: text("details_hash").notNull(),
    imageSetHash: text("image_set_hash").notNull(),
    priceMinCents: integer("price_min_cents"),
    priceMaxCents: integer("price_max_cents"),
    currencyCode: text("currency_code").notNull().default("USD"),
    availableForSale: boolean("available_for_sale").notNull().default(false),
    archivedAt: timestamp("archived_at", { mode: "date", withTimezone: true }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    makerIdIdx: index("tmp_autmog_pens_maker_id_idx").on(table.makerId),
    mechanismIdIdx: index("tmp_autmog_pens_mechanism_id_idx").on(
      table.mechanismId,
    ),
    sourceProductIdUnique: uniqueIndex(
      "tmp_autmog_pens_source_product_id_unique",
    ).on(table.sourceProductId),
  }),
);

export const tmpAutmogPenMaterials = pgTable(
  "tmp_autmog_pen_materials",
  {
    penId: bigint("pen_id", { mode: "number" })
      .notNull()
      .references(() => tmpAutmogPens.id, { onDelete: "cascade" }),
    materialId: bigint("material_id", { mode: "number" })
      .notNull()
      .references(() => materials.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    materialIdIdx: index("tmp_autmog_pen_materials_material_id_idx").on(
      table.materialId,
    ),
    pk: primaryKey({
      columns: [table.penId, table.materialId],
      name: "tmp_autmog_pen_materials_pk",
    }),
  }),
);

export const tmpAutmogPenImages = pgTable(
  "tmp_autmog_pen_images",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity({ startWith: 1000 }),
    penId: bigint("pen_id", { mode: "number" })
      .notNull()
      .references(() => tmpAutmogPens.id, { onDelete: "cascade" }),
    altText: text("alt_text"),
    width: integer("width"),
    height: integer("height"),
    sourceHash: text("source_hash").notNull(),
    imageKitFileId: text("image_kit_file_id"),
    imageKitPath: text("image_kit_path"),
    imageKitUrl: text("image_kit_url"),
    imageKitThumbnailUrl: text("image_kit_thumbnail_url"),
    status: text("status").notNull().default("pending_upload"),
    uploadedAt: timestamp("uploaded_at", { mode: "date", withTimezone: true }),
    pendingDeleteAt: timestamp("pending_delete_at", {
      mode: "date",
      withTimezone: true,
    }),
    deletedAt: timestamp("deleted_at", { mode: "date", withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    penIdIdx: index("tmp_autmog_pen_images_pen_id_idx").on(table.penId),
    penSourceHashUnique: uniqueIndex(
      "tmp_autmog_pen_images_pen_source_hash_unique",
    ).on(table.penId, table.sourceHash),
    statusIdx: index("tmp_autmog_pen_images_status_idx").on(table.status),
  }),
);

export const tmpProducts = pgTable(
  "tmp_products",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity({ startWith: 1000 }),
    autmogPenId: bigint("autmog_pen_id", { mode: "number" }).references(
      () => tmpAutmogPens.id,
      { onDelete: "cascade" },
    ),
  },
  (table) => ({
    autmogPenIdUnique: uniqueIndex("tmp_products_autmog_pen_id_unique").on(
      table.autmogPenId,
    ),
  }),
);

export const tmpProductProductTypes = pgTable(
  "tmp_product_product_types",
  {
    productId: bigint("product_id", { mode: "number" })
      .notNull()
      .references(() => tmpProducts.id, { onDelete: "cascade" }),
    productTypeId: bigint("product_type_id", { mode: "number" })
      .notNull()
      .references(() => productTypes.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.productId, table.productTypeId],
      name: "tmp_product_product_types_pk",
    }),
    productTypeIdIdx: index("tmp_product_product_types_product_type_id_idx").on(
      table.productTypeId,
    ),
  }),
);

export const tmpAutmogPenVersions = pgTable(
  "tmp_autmog_pen_versions",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity({ startWith: 1000 }),
    penId: bigint("pen_id", { mode: "number" })
      .notNull()
      .references(() => tmpAutmogPens.id, { onDelete: "cascade" }),
    sourceProductId: text("source_product_id").notNull(),
    previousDetailsHash: text("previous_details_hash"),
    nextDetailsHash: text("next_details_hash").notNull(),
    previousImageSetHash: text("previous_image_set_hash"),
    nextImageSetHash: text("next_image_set_hash").notNull(),
    snapshot: jsonb("snapshot").$type<AutmogPenNormalizedData>().notNull(),
    changeReason: text("change_reason").notNull(),
    capturedAt: timestamp("captured_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    replacedAt: timestamp("replaced_at", { mode: "date", withTimezone: true }),
  },
  (table) => ({
    penIdIdx: index("tmp_autmog_pen_versions_pen_id_idx").on(table.penId),
    sourceProductIdIdx: index(
      "tmp_autmog_pen_versions_source_product_id_idx",
    ).on(table.sourceProductId),
  }),
);

export type Maker = typeof makers.$inferSelect;
export type NewMaker = typeof makers.$inferInsert;
export type Material = typeof materials.$inferSelect;
export type NewMaterial = typeof materials.$inferInsert;
export type Mechanism = typeof mechanisms.$inferSelect;
export type NewMechanism = typeof mechanisms.$inferInsert;
export type ProductType = typeof productTypes.$inferSelect;
export type NewProductType = typeof productTypes.$inferInsert;
export type ScraperRun = typeof scraperRuns.$inferSelect;
export type NewScraperRun = typeof scraperRuns.$inferInsert;
export type TmpAutmogPen = typeof tmpAutmogPens.$inferSelect;
export type NewTmpAutmogPen = typeof tmpAutmogPens.$inferInsert;
export type TmpAutmogPenMaterial = typeof tmpAutmogPenMaterials.$inferSelect;
export type NewTmpAutmogPenMaterial = typeof tmpAutmogPenMaterials.$inferInsert;
export type TmpAutmogPenImage = typeof tmpAutmogPenImages.$inferSelect;
export type NewTmpAutmogPenImage = typeof tmpAutmogPenImages.$inferInsert;
export type TmpAutmogPenVersion = typeof tmpAutmogPenVersions.$inferSelect;
export type NewTmpAutmogPenVersion = typeof tmpAutmogPenVersions.$inferInsert;
export type TmpProduct = typeof tmpProducts.$inferSelect;
export type NewTmpProduct = typeof tmpProducts.$inferInsert;
export type TmpProductProductType = typeof tmpProductProductTypes.$inferSelect;
export type NewTmpProductProductType =
  typeof tmpProductProductTypes.$inferInsert;

import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
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

export const tmpAutmogPens = pgTable(
  "tmp_autmog_pens",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity({ startWith: 1000 }),
    makerId: bigint("maker_id", { mode: "number" })
      .notNull()
      .references(() => makers.id, { onDelete: "restrict" }),
    sourceProductId: text("source_product_id").notNull(),
    sourceHandle: text("source_handle").notNull(),
    title: text("title").notNull(),
    productUrl: text("product_url").notNull(),
    vendor: text("vendor"),
    productType: text("product_type"),
    bodyHtml: text("body_html"),
    bodyText: text("body_text"),
    category: text("category"),
    size: text("size"),
    mechanism: text("mechanism"),
    refill: text("refill"),
    nose: text("nose"),
    clip: text("clip"),
    grip: text("grip"),
    finish: text("finish"),
    bodyShape: text("body_shape"),
    materials: jsonb("materials")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
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
    rawShopifyData: jsonb("raw_shopify_data").$type<unknown>().notNull(),
    rawPayloadHash: text("raw_payload_hash").notNull(),
    detailsHash: text("details_hash").notNull(),
    imageSetHash: text("image_set_hash").notNull(),
    priceMinCents: integer("price_min_cents"),
    priceMaxCents: integer("price_max_cents"),
    currencyCode: text("currency_code").notNull().default("USD"),
    availableForSale: boolean("available_for_sale").notNull().default(false),
    sourceCreatedAt: timestamp("source_created_at", {
      mode: "date",
      withTimezone: true,
    }),
    sourceUpdatedAt: timestamp("source_updated_at", {
      mode: "date",
      withTimezone: true,
    }),
    sourcePublishedAt: timestamp("source_published_at", {
      mode: "date",
      withTimezone: true,
    }),
    firstSeenAt: timestamp("first_seen_at", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp("last_seen_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    isArchived: boolean("is_archived").notNull().default(false),
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
    sourceProductIdUnique: uniqueIndex(
      "tmp_autmog_pens_source_product_id_unique",
    ).on(table.sourceProductId),
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
    sourceImageId: text("source_image_id"),
    sourceUrl: text("source_url").notNull(),
    position: integer("position").notNull(),
    altText: text("alt_text"),
    width: integer("width"),
    height: integer("height"),
    sourceHash: text("source_hash").notNull(),
    imageKitFileId: text("image_kit_file_id"),
    imageKitPath: text("image_kit_path"),
    imageKitUrl: text("image_kit_url"),
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
    penSourceUrlUnique: uniqueIndex(
      "tmp_autmog_pen_images_pen_source_url_unique",
    ).on(table.penId, table.sourceUrl),
    statusIdx: index("tmp_autmog_pen_images_status_idx").on(table.status),
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
export type ScraperRun = typeof scraperRuns.$inferSelect;
export type NewScraperRun = typeof scraperRuns.$inferInsert;
export type TmpAutmogPen = typeof tmpAutmogPens.$inferSelect;
export type NewTmpAutmogPen = typeof tmpAutmogPens.$inferInsert;
export type TmpAutmogPenImage = typeof tmpAutmogPenImages.$inferSelect;
export type NewTmpAutmogPenImage = typeof tmpAutmogPenImages.$inferInsert;
export type TmpAutmogPenVersion = typeof tmpAutmogPenVersions.$inferSelect;
export type NewTmpAutmogPenVersion = typeof tmpAutmogPenVersions.$inferInsert;

import { relations } from "drizzle-orm";
import {
  makers,
  materials,
  mechanisms,
  productTypes,
  scraperRuns,
  tmpAutmogPenImages,
  tmpAutmogPenMaterials,
  tmpAutmogPens,
  tmpAutmogPenVersions,
  tmpProductProductTypes,
  tmpProducts,
} from "./scraper.js";
import { userSettings } from "./user-settings.js";
import { users } from "./users.js";

export const usersRelations = relations(users, ({ one }) => ({
  settings: one(userSettings),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const makersRelations = relations(makers, ({ many }) => ({
  autmogPens: many(tmpAutmogPens),
}));

export const materialsRelations = relations(materials, ({ many }) => ({
  autmogPens: many(tmpAutmogPenMaterials),
}));

export const mechanismsRelations = relations(mechanisms, ({ many }) => ({
  autmogPens: many(tmpAutmogPens),
}));

export const productTypesRelations = relations(productTypes, ({ many }) => ({
  products: many(tmpProductProductTypes),
}));

export const scraperRunsRelations = relations(scraperRuns, () => ({}));

export const tmpAutmogPensRelations = relations(
  tmpAutmogPens,
  ({ many, one }) => ({
    images: many(tmpAutmogPenImages),
    maker: one(makers, {
      fields: [tmpAutmogPens.makerId],
      references: [makers.id],
    }),
    materials: many(tmpAutmogPenMaterials),
    mechanism: one(mechanisms, {
      fields: [tmpAutmogPens.mechanismId],
      references: [mechanisms.id],
    }),
    product: one(tmpProducts),
    versions: many(tmpAutmogPenVersions),
  }),
);

export const tmpAutmogPenMaterialsRelations = relations(
  tmpAutmogPenMaterials,
  ({ one }) => ({
    material: one(materials, {
      fields: [tmpAutmogPenMaterials.materialId],
      references: [materials.id],
    }),
    pen: one(tmpAutmogPens, {
      fields: [tmpAutmogPenMaterials.penId],
      references: [tmpAutmogPens.id],
    }),
  }),
);

export const tmpProductsRelations = relations(tmpProducts, ({ many, one }) => ({
  autmogPen: one(tmpAutmogPens, {
    fields: [tmpProducts.autmogPenId],
    references: [tmpAutmogPens.id],
  }),
  productTypes: many(tmpProductProductTypes),
}));

export const tmpProductProductTypesRelations = relations(
  tmpProductProductTypes,
  ({ one }) => ({
    product: one(tmpProducts, {
      fields: [tmpProductProductTypes.productId],
      references: [tmpProducts.id],
    }),
    productType: one(productTypes, {
      fields: [tmpProductProductTypes.productTypeId],
      references: [productTypes.id],
    }),
  }),
);

export const tmpAutmogPenImagesRelations = relations(
  tmpAutmogPenImages,
  ({ one }) => ({
    pen: one(tmpAutmogPens, {
      fields: [tmpAutmogPenImages.penId],
      references: [tmpAutmogPens.id],
    }),
  }),
);

export const tmpAutmogPenVersionsRelations = relations(
  tmpAutmogPenVersions,
  ({ one }) => ({
    pen: one(tmpAutmogPens, {
      fields: [tmpAutmogPenVersions.penId],
      references: [tmpAutmogPens.id],
    }),
  }),
);

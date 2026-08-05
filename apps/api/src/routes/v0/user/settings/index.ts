import { clerkMiddleware, getAuth } from "@clerk/hono";
import { OpenAPIHono, z } from "@hono/zod-openapi";
import {
  type CurrencyCode,
  type DimensionUnit,
  schema as databaseSchema,
  type ThemeMode,
  type WeightUnit,
} from "@package/database";
import {
  defaultUserSettings,
  type UserSettingsService,
} from "@package/services";
import type { Context } from "hono";
import { ErrorResponseSchema, jsonContent } from "../../../../openapi.js";
import type { AppDependencies } from "../../../dependencies.js";

const { currencyCodes, dimensionUnits, themeModes, weightUnits } =
  databaseSchema;

const UserSettingsSchema = z
  .object({
    currencyCode: z.enum(currencyCodes).openapi({
      example: "USD",
    }),
    dimensionUnit: z.enum(dimensionUnits).openapi({
      example: "in",
    }),
    theme: z.enum(themeModes).openapi({
      example: "system",
    }),
    weightUnit: z.enum(weightUnits).openapi({
      example: "g",
    }),
  })
  .openapi("UserSettings");

const UserSettingsPatchSchema = UserSettingsSchema.partial()
  .refine((settings) => Object.keys(settings).length > 0, {
    message: "At least one setting must be provided.",
  })
  .openapi("UserSettingsPatch");

export function createUserSettingsRouter(dependencies: AppDependencies = {}) {
  const router = new OpenAPIHono();

  if (!dependencies.getUserSettingsAuth) {
    router.use("/user/settings", clerkMiddleware());
  }

  router.openAPIRegistry.registerPath({
    method: "get",
    path: "/user/settings",
    operationId: "getUserSettings",
    summary: "Get user settings",
    tags: ["User Settings"],
    responses: {
      200: {
        description: "The authenticated user's settings.",
        content: jsonContent(UserSettingsSchema),
      },
      401: {
        description: "The request was not authenticated.",
        content: jsonContent(ErrorResponseSchema),
      },
    },
  });

  router.get("/user/settings", async (context) => {
    const auth = await requireUserSettingsAuth(context, dependencies);

    if (!auth) {
      return context.json({ error: "Unauthorized." }, 401);
    }

    const settings = await (
      await getUserSettingsService(context, dependencies)
    ).getByClerkId(auth.clerkId);

    return context.json(
      toUserSettingsResponse(settings ?? defaultUserSettings),
    );
  });

  router.openAPIRegistry.registerPath({
    method: "patch",
    path: "/user/settings",
    operationId: "patchUserSettings",
    summary: "Patch user settings",
    tags: ["User Settings"],
    request: {
      body: {
        required: true,
        content: jsonContent(UserSettingsPatchSchema),
      },
    },
    responses: {
      200: {
        description: "The updated authenticated user's settings.",
        content: jsonContent(UserSettingsSchema),
      },
      400: {
        description: "The request body was not valid.",
        content: jsonContent(ErrorResponseSchema),
      },
      401: {
        description: "The request was not authenticated.",
        content: jsonContent(ErrorResponseSchema),
      },
    },
  });

  router.patch("/user/settings", async (context) => {
    const auth = await requireUserSettingsAuth(context, dependencies);

    if (!auth) {
      return context.json({ error: "Unauthorized." }, 401);
    }

    const body = UserSettingsPatchSchema.safeParse(await readJson(context));

    if (!body.success) {
      return context.json(
        { error: "Expected a valid JSON request body." },
        400,
      );
    }

    const settings = await (
      await getUserSettingsService(context, dependencies)
    ).patchForClerkId(auth.clerkId, body.data);

    return context.json(toUserSettingsResponse(settings));
  });

  return router;
}

async function readJson(context: Context) {
  try {
    return await context.req.json();
  } catch {
    return null;
  }
}

async function requireUserSettingsAuth(
  context: Context,
  dependencies: AppDependencies,
) {
  if (dependencies.getUserSettingsAuth) {
    return await dependencies.getUserSettingsAuth(context);
  }

  const auth = getAuth(context);

  return auth?.userId ? { clerkId: auth.userId } : null;
}

async function getUserSettingsService(
  context: Context,
  dependencies: AppDependencies,
): Promise<UserSettingsService> {
  if (dependencies.getUserSettingsService) {
    return await dependencies.getUserSettingsService(context);
  }

  const { s } = await import("../../../../lib/services.js");

  return s.db.userSettings;
}

function toUserSettingsResponse(settings: {
  currencyCode: CurrencyCode;
  dimensionUnit: DimensionUnit;
  theme: ThemeMode;
  weightUnit: WeightUnit;
}) {
  return {
    currencyCode: settings.currencyCode,
    dimensionUnit: settings.dimensionUnit,
    theme: settings.theme,
    weightUnit: settings.weightUnit,
  };
}

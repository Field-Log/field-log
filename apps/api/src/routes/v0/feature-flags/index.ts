import { clerkMiddleware, getAuth } from "@clerk/hono";
import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { FeatureFlagsService } from "@package/services";
import type { Context } from "hono";
import { ErrorResponseSchema, jsonContent } from "../../../openapi.js";
import type { AppDependencies } from "../../dependencies.js";

const FeatureFlagBetaItemSchema = z
  .object({
    description: z.string().nullable().openapi({
      example: "Enable the new library filters.",
    }),
    enabled: z.boolean().openapi({
      example: true,
    }),
    name: z.string().openapi({
      example: "New library filters",
    }),
    slug: z.string().openapi({
      example: "new-library-filters",
    }),
  })
  .openapi("FeatureFlagBetaItem");

const FeatureFlagBetaListResponseSchema = z
  .object({
    flags: z.array(FeatureFlagBetaItemSchema),
  })
  .openapi("FeatureFlagBetaListResponse");

const FeatureFlagToggleRequestSchema = z
  .object({
    enabled: z.boolean(),
  })
  .openapi("FeatureFlagToggleRequest");

const FeatureFlagToggleResponseSchema = z
  .object({
    enabled: z.boolean(),
    slug: z.string(),
  })
  .openapi("FeatureFlagToggleResponse");

const FeatureFlagEvaluateRequestSchema = z
  .object({
    slugs: z.array(z.string().min(1)).min(1).max(50),
  })
  .openapi("FeatureFlagEvaluateRequest");

const FeatureFlagEvaluateResponseSchema = z
  .object({
    flags: z.record(z.string(), z.boolean()),
  })
  .openapi("FeatureFlagEvaluateResponse");

export function createFeatureFlagsRouter(dependencies: AppDependencies = {}) {
  const router = new OpenAPIHono();

  if (!dependencies.getFeatureFlagAuth) {
    router.use("/feature-flags/*", clerkMiddleware());
  }

  router.openAPIRegistry.registerPath({
    method: "get",
    path: "/feature-flags/beta",
    operationId: "listBetaFeatureFlags",
    summary: "List user beta feature flags",
    tags: ["Feature Flags"],
    responses: {
      200: {
        description: "The authenticated user's beta feature flags.",
        content: jsonContent(FeatureFlagBetaListResponseSchema),
      },
      401: {
        description: "The request was not authenticated.",
        content: jsonContent(ErrorResponseSchema),
      },
    },
  });

  router.get("/feature-flags/beta", async (context) => {
    const auth = await requireFeatureFlagAuth(context, dependencies);

    if (!auth) {
      return context.json({ error: "Unauthorized." }, 401);
    }

    const flags = await (
      await getFeatureFlagsService(context, dependencies)
    ).listUserBeta(auth.clerkId);

    return context.json({ flags });
  });

  router.openAPIRegistry.registerPath({
    method: "put",
    path: "/feature-flags/beta/{slug}",
    operationId: "setBetaFeatureFlag",
    summary: "Set a user beta feature flag preference",
    tags: ["Feature Flags"],
    request: {
      params: z.object({
        slug: z.string().openapi({
          param: {
            name: "slug",
            in: "path",
            required: true,
          },
        }),
      }),
      body: {
        required: true,
        content: jsonContent(FeatureFlagToggleRequestSchema),
      },
    },
    responses: {
      200: {
        description: "The updated beta feature flag preference.",
        content: jsonContent(FeatureFlagToggleResponseSchema),
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

  router.put("/feature-flags/beta/:slug", async (context) => {
    const auth = await requireFeatureFlagAuth(context, dependencies);

    if (!auth) {
      return context.json({ error: "Unauthorized." }, 401);
    }

    const body = FeatureFlagToggleRequestSchema.safeParse(
      await readJson(context),
    );

    if (!body.success) {
      return context.json(
        { error: "Expected a valid JSON request body." },
        400,
      );
    }

    const slug = context.req.param("slug");

    await (
      await getFeatureFlagsService(context, dependencies)
    ).setUserPreference({
      actorClerkId: auth.clerkId,
      enabled: body.data.enabled,
      slug,
    });

    return context.json({
      enabled: body.data.enabled,
      slug,
    });
  });

  router.openAPIRegistry.registerPath({
    method: "post",
    path: "/feature-flags/evaluate",
    operationId: "evaluateFeatureFlags",
    summary: "Evaluate feature flags for the authenticated user",
    tags: ["Feature Flags"],
    request: {
      body: {
        required: true,
        content: jsonContent(FeatureFlagEvaluateRequestSchema),
      },
    },
    responses: {
      200: {
        description: "Evaluated feature flags.",
        content: jsonContent(FeatureFlagEvaluateResponseSchema),
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

  router.post("/feature-flags/evaluate", async (context) => {
    const auth = await requireFeatureFlagAuth(context, dependencies);

    if (!auth) {
      return context.json({ error: "Unauthorized." }, 401);
    }

    const body = FeatureFlagEvaluateRequestSchema.safeParse(
      await readJson(context),
    );

    if (!body.success) {
      return context.json(
        { error: "Expected a valid JSON request body." },
        400,
      );
    }

    const flags = await (
      await getFeatureFlagsService(context, dependencies)
    ).evaluateMany({
      clerkId: auth.clerkId,
      slugs: body.data.slugs,
    });

    return context.json({ flags });
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

async function requireFeatureFlagAuth(
  context: Context,
  dependencies: AppDependencies,
) {
  if (dependencies.getFeatureFlagAuth) {
    return await dependencies.getFeatureFlagAuth(context);
  }

  const auth = getAuth(context);

  return auth?.userId ? { clerkId: auth.userId } : null;
}

async function getFeatureFlagsService(
  context: Context,
  dependencies: AppDependencies,
): Promise<FeatureFlagsService> {
  if (!dependencies.getFeatureFlagsService) {
    throw new Error("Feature flag service dependency is not configured.");
  }

  return await dependencies.getFeatureFlagsService(context);
}

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  featureFlagAudiences,
  featureFlagOverrideSources,
} from "../src/schema/enums.js";

const sharedFeatureFlagsPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../feature-flags/src/index.ts",
);

function readSharedStringArray(exportName: string): string[] {
  const sourceFile = ts.createSourceFile(
    sharedFeatureFlagsPath,
    readFileSync(sharedFeatureFlagsPath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === exportName &&
        declaration.initializer
      ) {
        return readStringArrayInitializer(declaration.initializer, exportName);
      }
    }
  }

  throw new Error(`Could not find ${exportName} in ${sharedFeatureFlagsPath}.`);
}

function readStringArrayInitializer(
  initializer: ts.Expression,
  exportName: string,
): string[] {
  const expression = ts.isAsExpression(initializer)
    ? initializer.expression
    : initializer;

  if (!ts.isArrayLiteralExpression(expression)) {
    throw new Error(`${exportName} must be an array literal.`);
  }

  return expression.elements.map((element) => {
    if (!ts.isStringLiteral(element)) {
      throw new Error(`${exportName} must contain only string literals.`);
    }

    return element.text;
  });
}

describe("feature flag schema enums", () => {
  it("match the shared feature flag package constants", () => {
    expect(featureFlagAudiences).toEqual(
      readSharedStringArray("featureFlagAudiences"),
    );
    expect(featureFlagOverrideSources).toEqual(
      readSharedStringArray("featureFlagOverrideSources"),
    );
  });
});

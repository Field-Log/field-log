figma.showUI(__html__, {
  height: 560,
  themeColors: true,
  width: 420,
});

figma.ui.onmessage = async (message) => {
  if (message.type === "apply-payload") {
    try {
      const result = await applyPayload(message.payload);
      figma.ui.postMessage({ result, type: "apply-result" });
      figma.notify(`Applied ${result.createdCount} FigJam operations.`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      figma.ui.postMessage({ error: errorMessage, type: "apply-result" });
      figma.notify(errorMessage, { error: true });
    }
  }
};

async function applyPayload(payload) {
  validatePayloadShape(payload);

  if (typeof figma.fileKey === "string" && figma.fileKey !== payload.fileKey) {
    throw new Error(
      `Payload targets ${payload.fileKey}, but this file is ${figma.fileKey}.`,
    );
  }

  await loadPayloadFonts();

  const createdById = new Map();
  let createdCount = 0;

  for (const operation of payload.operations) {
    const node = await applyOperation(operation, createdById);
    if (node) {
      createdById.set(operation.id, node);
      createdCount += 1;
    }
  }

  await createAuditStamp(payload, createdCount);

  return {
    createdCount,
    fileKey: payload.fileKey,
    payloadId: payload.payloadId,
  };
}

async function applyOperation(operation, createdById) {
  switch (operation.type) {
    case "section":
      return createSection(operation);
    case "sticky":
      return createSticky(operation);
    case "shape":
      return createShape(operation);
    case "connector":
      return createConnector(operation, createdById);
    case "stamp":
      return createStamp(operation);
    default:
      throw new Error(`Unsupported operation type: ${operation.type}.`);
  }
}

function createSection(operation) {
  if (typeof figma.createSection !== "function") {
    throw new Error("This editor does not support section creation.");
  }

  const section = figma.createSection();
  section.name = operation.title;
  section.x = operation.x;
  section.y = operation.y;
  resize(section, operation.width, operation.height);
  figma.currentPage.appendChild(section);
  return section;
}

function createSticky(operation) {
  if (typeof figma.createSticky !== "function") {
    throw new Error("This editor does not support sticky creation.");
  }

  const sticky = figma.createSticky();
  sticky.x = operation.x;
  sticky.y = operation.y;
  applyStickyColor(sticky, operation.color);
  if (sticky.text) {
    sticky.text.characters = operation.text;
  }
  figma.currentPage.appendChild(sticky);
  return sticky;
}

async function createShape(operation) {
  if (typeof figma.createRectangle !== "function") {
    return createFallbackShape(operation);
  }

  const rect = figma.createRectangle();
  rect.name = operation.text || operation.id;
  rect.x = operation.x;
  rect.y = operation.y;
  resize(rect, operation.width, operation.height);
  applyRectStyle(rect, operation);
  figma.currentPage.appendChild(rect);

  if (!operation.text) {
    return rect;
  }

  const text = await createShapeText(operation);
  figma.currentPage.appendChild(text);

  if (typeof figma.group === "function") {
    return figma.group([rect, text], figma.currentPage);
  }

  return rect;
}

function createFallbackShape(operation) {
  if (typeof figma.createShapeWithText !== "function") {
    throw new Error("This editor does not support shape creation.");
  }

  const shape = figma.createShapeWithText();
  shape.x = operation.x;
  shape.y = operation.y;
  resize(shape, operation.width, operation.height);

  if ("shapeType" in shape) {
    shape.shapeType = "ROUNDED_RECTANGLE";
  }

  if (shape.text && operation.text) {
    shape.text.characters = operation.text;
  }

  figma.currentPage.appendChild(shape);
  return shape;
}

function createConnector(operation, createdById) {
  if (typeof figma.createConnector !== "function") {
    return undefined;
  }

  const startNode = createdById.get(operation.from);
  const endNode = createdById.get(operation.to);
  if (!startNode || !endNode) {
    return undefined;
  }

  const connector = figma.createConnector();
  connector.connectorStart = { endpointNodeId: startNode.id, magnet: "AUTO" };
  connector.connectorEnd = { endpointNodeId: endNode.id, magnet: "AUTO" };
  if (connector.text && operation.text) {
    connector.text.characters = operation.text;
  }
  figma.currentPage.appendChild(connector);
  return connector;
}

async function createStamp(operation) {
  const text = figma.createText();
  text.characters = operation.text;
  text.fontSize = 14;
  text.x = operation.x;
  text.y = operation.y;
  figma.currentPage.appendChild(text);
  return text;
}

async function createAuditStamp(payload, createdCount) {
  const y = 40;
  const x = 40;
  const task = payload.source.task ? ` - ${payload.source.task}` : "";
  await createStamp({
    id: `${payload.payloadId}-audit`,
    text: `Applied ${payload.payloadId} from ${payload.source.agent}${task}. Operations: ${createdCount}.`,
    type: "stamp",
    x,
    y,
  });
}

function resize(node, width, height) {
  if (typeof node.resizeWithoutConstraints === "function") {
    node.resizeWithoutConstraints(width, height);
    return;
  }

  if (typeof node.resize === "function") {
    node.resize(width, height);
  }
}

async function createShapeText(operation) {
  const text = figma.createText();
  const padding = operation.textPadding ?? 10;
  const fontSize = operation.fontSize ?? 12;
  text.characters = operation.text;
  text.fontSize = fontSize;
  text.fills = [solidPaint(operation.textColor ?? "#171717")];
  if ("textAlignHorizontal" in text) {
    text.textAlignHorizontal =
      operation.textAlign === "center" ? "CENTER" : "LEFT";
  }

  const textWidth = Math.max(1, operation.width - padding * 2);
  const textHeight = Math.max(1, operation.height - padding * 2);
  resize(text, textWidth, textHeight);

  text.x = operation.x + padding;
  text.y = operation.y + padding;

  if (operation.textPosition === "center") {
    text.y = operation.y + (operation.height - text.height) / 2;
  }

  return text;
}

async function loadPayloadFonts() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown plugin error.";
}

function applyStickyColor(sticky, color) {
  const paint = stickyColorPaint(color);
  if (!paint || !("fills" in sticky)) {
    return;
  }

  sticky.fills = [paint];
}

function stickyColorPaint(color) {
  switch (color) {
    case "blue":
      return solidPaint("#a5d8ff");
    case "green":
      return solidPaint("#b2f2bb");
    case "pink":
      return solidPaint("#ffc9de");
    case "yellow":
      return solidPaint("#ffec99");
    default:
      return undefined;
  }
}

function applyRectStyle(rect, operation) {
  rect.fills =
    operation.fill === "none" ? [] : [solidPaint(operation.fill ?? "#ffffff")];
  rect.strokes = [solidPaint(operation.stroke ?? "#d4d4d4")];
  rect.strokeWeight = 1;

  if ("cornerRadius" in rect) {
    rect.cornerRadius = operation.radius ?? 8;
  }
}

function solidPaint(color) {
  const hex = color.replace("#", "");
  return {
    color: {
      b: Number.parseInt(hex.slice(4, 6), 16) / 255,
      g: Number.parseInt(hex.slice(2, 4), 16) / 255,
      r: Number.parseInt(hex.slice(0, 2), 16) / 255,
    },
    type: "SOLID",
  };
}

function validatePayloadShape(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload must be an object.");
  }

  if (payload.schemaVersion !== "figjam-bridge/v1") {
    throw new Error("Unsupported payload schema version.");
  }

  if (!payload.fileKey || typeof payload.fileKey !== "string") {
    throw new Error("Payload fileKey is required.");
  }

  if (!Array.isArray(payload.operations) || payload.operations.length === 0) {
    throw new Error("Payload must include operations.");
  }
}

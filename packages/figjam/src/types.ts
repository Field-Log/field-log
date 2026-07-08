export const payloadSchemaVersion = "figjam-bridge/v1";

export type AgentName = "codex" | "claude" | "user" | "system";

export type FigjamOperation =
  | {
      height: number;
      id: string;
      title: string;
      type: "section";
      width: number;
      x: number;
      y: number;
    }
  | {
      color?: "blue" | "green" | "pink" | "yellow";
      id: string;
      text: string;
      type: "sticky";
      x: number;
      y: number;
    }
  | {
      fill?: string;
      fontSize?: number;
      height: number;
      id: string;
      radius?: number;
      stroke?: string;
      text?: string;
      textAlign?: "center" | "left";
      textColor?: string;
      textPadding?: number;
      textPosition?: "center" | "top-left";
      type: "shape";
      width: number;
      x: number;
      y: number;
    }
  | {
      from: string;
      id: string;
      text?: string;
      to: string;
      type: "connector";
    }
  | {
      id: string;
      text: string;
      type: "stamp";
      x: number;
      y: number;
    };

export type FigjamPayload = {
  fileKey: string;
  operations: FigjamOperation[];
  payloadId: string;
  schemaVersion: typeof payloadSchemaVersion;
  source: {
    agent: AgentName;
    branch?: string;
    commit?: string;
    createdAt: string;
    task?: string;
  };
};

export type FigmaApiConfig = {
  accessToken: string;
  allowedFileKeys: readonly string[];
  defaultFileKey: string;
};

export type FigmaComment = {
  created_at?: string;
  file_key?: string;
  id?: string;
  message?: string;
  user?: {
    handle?: string;
  };
};

export type FigjamSnapshot = {
  comments?: FigmaComment[];
  fetchedAt: string;
  file: unknown;
  fileKey: string;
};

export type FigjamSummaryNode = {
  characters?: string;
  id: string;
  name?: string;
  type: string;
};

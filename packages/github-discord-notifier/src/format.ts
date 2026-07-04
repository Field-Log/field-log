export type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type DiscordEmbed = {
  title: string;
  description: string;
  url: string;
  color: number;
  fields: DiscordEmbedField[];
  footer: {
    text: string;
  };
  timestamp: string;
};

export type DiscordPayload = {
  allowed_mentions: {
    parse: [];
  };
  embeds: [DiscordEmbed];
  components: [
    {
      type: 1;
      components: [
        {
          type: 2;
          style: 5;
          label: string;
          url: string;
        },
      ];
    },
  ];
};

export type Notification = {
  payload: DiscordPayload;
};

export type FormatContext = {
  eventName: string;
  repository: string;
  runId?: string;
  serverUrl: string;
  sha?: string;
};

type ColorName = "amber" | "blue" | "gray" | "green" | "red";

const colors = {
  amber: 0xf59e0b,
  blue: 0x2563eb,
  gray: 0x6b7280,
  green: 0x16a34a,
  red: 0xdc2626,
} as const satisfies Record<ColorName, number>;

const maxTitleLength = 256;
const maxDescriptionLength = 4096;
const maxFieldValueLength = 1024;

export function formatGitHubNotification(
  context: FormatContext,
  event: unknown,
): Notification | undefined {
  switch (context.eventName) {
    case "pull_request":
      return formatPullRequest(context, asObject(event));
    case "pull_request_review":
      return formatPullRequestReview(context, asObject(event));
    case "push":
      return formatPush(context, asObject(event));
    case "workflow_run":
      return formatWorkflowRun(context, asObject(event));
    case "workflow_dispatch":
      return buildNotification({
        color: "blue",
        context,
        description: "Manual Discord notification test from GitHub Actions.",
        fields: [
          field("Repository", context.repository, true),
          field("Workflow run", workflowRunUrl(context), true),
        ],
        group: "Checks",
        title: "Manual notification test",
        url: workflowRunUrl(context),
      });
    default:
      return undefined;
  }
}

function formatPullRequest(
  context: FormatContext,
  event: Record<string, unknown>,
): Notification | undefined {
  const action = stringValue(event.action);
  const pullRequest = asObject(event.pull_request);
  const actor = login(event.sender);
  const url = stringValue(pullRequest.html_url);
  const title = stringValue(pullRequest.title) || "Untitled pull request";
  const number = numberValue(pullRequest.number);
  const merged = booleanValue(pullRequest.merged);
  const base = refName(pullRequest.base);
  const head = refName(pullRequest.head);
  const requestedReviewer = login(event.requested_reviewer);
  const requestedTeam = stringValue(asObject(event.requested_team).name);

  if (!action || !url || !number) {
    return undefined;
  }

  if (action === "closed" && merged) {
    return buildNotification({
      color: "green",
      context,
      description: `${actor} merged pull request #${number}.`,
      fields: prFields({
        action,
        actor,
        base,
        head,
        pullRequest,
        requestedReviewer,
        requestedTeam,
      }),
      group: "Merge",
      title: `#${number} ${title}`,
      url,
    });
  }

  const color = pullRequestColor(action);
  const actionText = pullRequestActionText(action);
  const notificationTitle =
    action === "synchronize" ? `#${number} ${title}` : `#${number} ${title}`;

  return buildNotification({
    color,
    context,
    description: `${actor} ${actionText} pull request #${number}.`,
    fields: prFields({
      action,
      actor,
      base,
      head,
      pullRequest,
      requestedReviewer,
      requestedTeam,
    }),
    group: action === "closed" ? "Merge" : "Pull Request",
    title: notificationTitle,
    url,
  });
}

function formatPullRequestReview(
  context: FormatContext,
  event: Record<string, unknown>,
): Notification | undefined {
  const action = stringValue(event.action);
  const pullRequest = asObject(event.pull_request);
  const review = asObject(event.review);
  const actor = login(event.sender);
  const url = stringValue(review.html_url) || stringValue(pullRequest.html_url);
  const title = stringValue(pullRequest.title) || "Untitled pull request";
  const number = numberValue(pullRequest.number);
  const state = stringValue(review.state).toLowerCase();

  if (!action || !url || !number) {
    return undefined;
  }

  const color = reviewColor(action, state);
  const stateText = reviewStateText(action, state);

  return buildNotification({
    color,
    context,
    description: `${actor} ${stateText} on pull request #${number}.`,
    fields: [
      field("Actor", actor, true),
      field("State", state || action, true),
      field("Pull request", `#${number}`, true),
      field("URL", url),
    ],
    group: "Review",
    title: `#${number} ${title}`,
    url,
  });
}

function formatPush(
  context: FormatContext,
  event: Record<string, unknown>,
): Notification | undefined {
  const ref = stringValue(event.ref);
  if (ref !== "refs/heads/main") {
    return undefined;
  }

  const commits = arrayValue(event.commits);
  const compareUrl = stringValue(event.compare);
  const headCommit = asObject(event.head_commit);
  const url =
    compareUrl || stringValue(headCommit.url) || repositoryUrl(context);
  const actor = login(event.sender);
  const commitCount = commits.length;

  return buildNotification({
    color: "blue",
    context,
    description: `${actor} pushed ${commitCount} ${pluralize(
      "commit",
      commitCount,
    )} to main.`,
    fields: [
      field("Actor", actor, true),
      field("Branch", "main", true),
      field("Commits", String(commitCount), true),
      field("URL", url),
    ],
    group: "Main",
    title: "New commit on main",
    url,
  });
}

function formatWorkflowRun(
  context: FormatContext,
  event: Record<string, unknown>,
): Notification | undefined {
  const workflowRun = asObject(event.workflow_run);
  const conclusion = stringValue(workflowRun.conclusion);
  const status = stringValue(workflowRun.status);
  const url = stringValue(workflowRun.html_url);
  const workflowName =
    stringValue(workflowRun.name) || stringValue(asObject(event.workflow).name);
  const actor = login(workflowRun.actor) || login(event.sender);

  if (!url || !workflowName || status !== "completed") {
    return undefined;
  }

  if (!isNotifiableWorkflowConclusion(conclusion)) {
    return undefined;
  }

  return buildNotification({
    color: workflowConclusionColor(conclusion),
    context,
    description: `${workflowName} completed with conclusion: ${conclusion}.`,
    fields: [
      field("Workflow", workflowName, true),
      field("Conclusion", conclusion, true),
      field("Actor", actor, true),
      field("URL", url),
    ],
    group: "Checks",
    title: `${workflowName} ${conclusion}`,
    url,
  });
}

function buildNotification(input: {
  color: ColorName;
  context: FormatContext;
  description: string;
  fields: DiscordEmbedField[];
  group: string;
  title: string;
  url: string;
}): Notification {
  const title = truncate(`[${input.group}] ${input.title}`, maxTitleLength);
  const description = truncate(input.description, maxDescriptionLength);
  const url = input.url;

  return {
    payload: {
      allowed_mentions: {
        parse: [],
      },
      embeds: [
        {
          title,
          description,
          url,
          color: colors[input.color],
          fields: input.fields.map((item) => ({
            ...item,
            value: truncate(item.value, maxFieldValueLength),
          })),
          footer: {
            text: input.context.repository,
          },
          timestamp: new Date().toISOString(),
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "Open in GitHub",
              url,
            },
          ],
        },
      ],
    },
  };
}

function prFields(input: {
  action: string;
  actor: string;
  base: string;
  head: string;
  pullRequest: Record<string, unknown>;
  requestedReviewer: string;
  requestedTeam: string;
}): DiscordEmbedField[] {
  const url = stringValue(input.pullRequest.html_url);
  const fields = [
    field("Actor", input.actor, true),
    field("Action", input.action, true),
    field("Base", input.base, true),
    field("Head", input.head, true),
  ];

  if (input.requestedReviewer) {
    fields.push(field("Reviewer", input.requestedReviewer, true));
  }

  if (input.requestedTeam) {
    fields.push(field("Team", input.requestedTeam, true));
  }

  if (url) {
    fields.push(field("URL", url));
  }

  return fields;
}

function field(
  name: string,
  value: string,
  inline?: boolean,
): DiscordEmbedField {
  return {
    name,
    value: value || "Unknown",
    ...(inline === undefined ? {} : { inline }),
  };
}

function pullRequestColor(action: string): ColorName {
  switch (action) {
    case "closed":
      return "gray";
    case "converted_to_draft":
    case "review_request_removed":
      return "amber";
    default:
      return "blue";
  }
}

function pullRequestActionText(action: string): string {
  switch (action) {
    case "opened":
      return "opened";
    case "reopened":
      return "reopened";
    case "ready_for_review":
      return "marked ready for review";
    case "converted_to_draft":
      return "converted to draft";
    case "synchronize":
      return "pushed new commits to";
    case "review_requested":
      return "requested review on";
    case "review_request_removed":
      return "removed a review request from";
    case "closed":
      return "closed without merging";
    default:
      return action.replaceAll("_", " ");
  }
}

function reviewColor(action: string, state: string): ColorName {
  if (action === "dismissed") {
    return "amber";
  }

  switch (state) {
    case "approved":
      return "green";
    case "changes_requested":
      return "red";
    case "commented":
      return "amber";
    default:
      return "blue";
  }
}

function reviewStateText(action: string, state: string): string {
  if (action === "dismissed") {
    return "dismissed a review";
  }

  switch (state) {
    case "approved":
      return "approved changes";
    case "changes_requested":
      return "requested changes";
    case "commented":
      return "left a review comment";
    default:
      return action.replaceAll("_", " ");
  }
}

function workflowConclusionColor(conclusion: string): ColorName {
  switch (conclusion) {
    case "failure":
    case "timed_out":
    case "action_required":
      return "red";
    case "cancelled":
    case "skipped":
      return "gray";
    default:
      return "amber";
  }
}

function isNotifiableWorkflowConclusion(conclusion: string): boolean {
  return [
    "action_required",
    "cancelled",
    "failure",
    "skipped",
    "timed_out",
  ].includes(conclusion);
}

function repositoryUrl(context: FormatContext): string {
  return `${context.serverUrl}/${context.repository}`;
}

function workflowRunUrl(context: FormatContext): string {
  if (!context.runId) {
    return repositoryUrl(context);
  }

  return `${repositoryUrl(context)}/actions/runs/${context.runId}`;
}

function refName(refObject: unknown): string {
  return stringValue(asObject(refObject).ref);
}

function login(value: unknown): string {
  return stringValue(asObject(value).login);
}

function pluralize(noun: string, count: number): string {
  return count === 1 ? noun : `${noun}s`;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function booleanValue(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

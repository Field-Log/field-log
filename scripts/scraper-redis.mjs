import { spawn } from "node:child_process";

export const scraperRedisContainerName = "field-log-scraper-redis";

export function getScraperRedisPort(env = process.env) {
  return env.SCRAPER_REDIS_PORT ?? "4008";
}

export function getScraperRedisUrl(env = process.env) {
  return env.REDIS_URL ?? `redis://localhost:${getScraperRedisPort(env)}`;
}

export async function ensureScraperRedisContainer({
  env = process.env,
  redisPort = getScraperRedisPort(env),
} = {}) {
  const existing = await capture("docker", [
    "ps",
    "-a",
    "--filter",
    `name=^/${scraperRedisContainerName}$`,
    "--format",
    "{{.Names}} {{.Status}}",
  ]);

  if (!existing.trim()) {
    await runCommand("docker", [
      "run",
      "--name",
      scraperRedisContainerName,
      "-p",
      `${redisPort}:6379`,
      "-d",
      "redis:8.2.1",
    ]);
    return;
  }

  if (!existing.includes("Up ")) {
    await runCommand("docker", ["start", scraperRedisContainerName]);
  }

  await assertScraperRedisPort(redisPort);
}

export function runCommand(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with ${code ?? "null"}`));
    });
  });
}

export function printScriptError(error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
}

function capture(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr || `${command} exited with ${code ?? "null"}`));
    });
  });
}

async function assertScraperRedisPort(expectedPort) {
  const portOutput = await capture("docker", [
    "port",
    scraperRedisContainerName,
    "6379/tcp",
  ]);
  const hostPorts = getHostPorts(portOutput);

  if (hostPorts.includes(expectedPort)) {
    return;
  }

  throw new Error(
    [
      `Existing Docker container "${scraperRedisContainerName}" is mapped to host port ${hostPorts.join(", ") || "unknown"}, but the scraper expects ${expectedPort}.`,
      "Docker cannot change port mappings on an existing container.",
      "",
      "To recreate the local scraper Redis container on the expected port, run:",
      `  docker rm -f ${scraperRedisContainerName}`,
      "  pnpm dev:scraper",
      "",
      "To keep using the existing container, run scraper commands with matching env:",
      `  SCRAPER_REDIS_PORT=${hostPorts[0] ?? "6379"} REDIS_URL=redis://localhost:${hostPorts[0] ?? "6379"} pnpm scraper:scrape -- autmog`,
    ].join("\n"),
  );
}

function getHostPorts(portOutput) {
  return [
    ...new Set(
      portOutput
        .trim()
        .split("\n")
        .map((line) => line.match(/:(\d+)$/)?.[1])
        .filter(Boolean),
    ),
  ];
}

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

import { spawn } from "node:child_process";

const containerName = "field-log-scraper-redis";
const redisPort = process.env.SCRAPER_REDIS_PORT ?? "4008";
const redisUrl = process.env.REDIS_URL ?? `redis://localhost:${redisPort}`;

await ensureRedisContainer();
await run("pnpm", ["--filter", "@app/scraper", "dev"], {
  ...process.env,
  REDIS_URL: redisUrl,
});

async function ensureRedisContainer() {
  const existing = await capture("docker", [
    "ps",
    "-a",
    "--filter",
    `name=^/${containerName}$`,
    "--format",
    "{{.Names}} {{.Status}}",
  ]);

  if (!existing.trim()) {
    await run("docker", [
      "run",
      "--name",
      containerName,
      "-p",
      `${redisPort}:6379`,
      "-d",
      "redis:8.2.1",
    ]);
    return;
  }

  if (!existing.includes("Up ")) {
    await run("docker", ["start", containerName]);
  }
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

function run(command, args, env = process.env) {
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

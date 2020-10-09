import { Client, ClientConfig, Connection } from "./mod.ts";
import { assertEquals } from "./test.deps.ts";

const { DB_PORT, DB_NAME, DB_PASSWORD, DB_USER, DB_HOST } = Deno.env.toObject();
const port = DB_PORT ? parseInt(DB_PORT) : 3306;
const db = DB_NAME || "test";
const password = DB_PASSWORD;
const username = DB_USER || "root";
const hostname = DB_HOST || "127.0.0.1";

const config = {
  timeout: 10000,
  poolSize: 3,
  debug: true,
  hostname,
  username,
  port,
  db,
  charset: "utf8mb4",
  password,
};
export function testWithClient(
  fn: (client: Client) => void | Promise<void>,
  overrideConfig?: ClientConfig,
) {
  Deno.test({
    name: fn.name,
    async fn() {
      const resources = Deno.resources();
      const client = await new Client().connect(
        { ...config, ...overrideConfig },
      );
      try {
        await fn(client);
      } finally {
        await client.close();
      }
      assertEquals(
        Deno.resources(),
        resources,
        "The client is leaking resources",
      );
    },
  });
}

export async function createTestDB() {
  const client = await new Client().connect({
    ...config,
    poolSize: 1,
    db: undefined,
  });
  await client.execute(`CREATE DATABASE IF NOT EXISTS ${db}`);
  await client.close();
}

export function isMariaDB(connection: Connection): boolean {
  return connection.serverVersion.includes("MariaDB");
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

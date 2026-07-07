import fs from "node:fs";
import path from "node:path";
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createApiKeysWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Writes repo-root .env.local from seeded Medusa data.
 * Run: npx medusa exec ./src/scripts/write-frontend-env.ts
 */
export default async function writeFrontendEnv({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve("query");

  const { data: publishableKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "token", "type"],
    filters: { type: "publishable" },
  });

  let publishableKey = publishableKeys?.[0];
  if (!publishableKey?.token) {
    const {
      result: [created],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [{ title: "Webshop", type: "publishable", created_by: "" }],
      },
    });
    publishableKey = created;
  }

  const { data: secretKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "token", "type"],
    filters: { type: "secret" },
  });

  let secretKey = secretKeys?.[0];
  if (!secretKey?.token) {
    const {
      result: [created],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [{ title: "Storefront Admin", type: "secret", created_by: "" }],
      },
    });
    secretKey = created;
  }

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  });

  const pkrRegion =
    regions?.find((r) => String(r.currency_code || "").toLowerCase() === "pkr") ||
    regions?.[0];

  const envPath = path.resolve(process.cwd(), "../../.env.local");
  const contents = `# Auto-generated for local dev — ${new Date().toISOString()}
NEXT_PUBLIC_COMMERCE_PROVIDER=medusa
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${publishableKey?.token || ""}
NEXT_PUBLIC_MEDUSA_REGION_ID=${pkrRegion?.id || ""}
NEXT_PUBLIC_MEDUSA_ADMIN_URL=http://localhost:9000/app

MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_ADMIN_API_TOKEN=${secretKey?.token || ""}
MEDUSA_STORE_ID=
ADMIN_PORTAL_SECRET=Admin123456
`;

  fs.writeFileSync(envPath, contents, "utf8");
  logger.info(`Wrote ${envPath}`);
  logger.info(`Region: ${pkrRegion?.name || "n/a"} (${pkrRegion?.id || "n/a"})`);
  logger.info("Publishable key and admin token are in .env.local (not logged here).");
}

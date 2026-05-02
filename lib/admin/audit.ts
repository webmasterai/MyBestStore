import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

type AuditEntry = {
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  payload?: unknown;
  at: string;
};

const AUDIT_DIR = path.join(process.cwd(), "logs");
const AUDIT_FILE = path.join(AUDIT_DIR, "admin-audit.log");

export async function writeAdminAudit(entry: Omit<AuditEntry, "at">) {
  const fullEntry: AuditEntry = {
    ...entry,
    at: new Date().toISOString(),
  };

  await mkdir(AUDIT_DIR, { recursive: true });
  await appendFile(AUDIT_FILE, `${JSON.stringify(fullEntry)}\n`, "utf8");
}

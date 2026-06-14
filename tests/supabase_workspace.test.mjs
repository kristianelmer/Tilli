import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const requiredEnv = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

function loadDotenv() {
  if (!existsSync(".env")) {
    return;
  }
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").replace(/^"|"$/g, "");
    }
  }
}

loadDotenv();

function hasRequiredEnv() {
  return requiredEnv.every((key) => Boolean(process.env[key])) && Boolean(getDatabaseConfig());
}

async function applyMigration() {
  const sql = await readFile("supabase/migrations/0001_authenticated_workspace.sql", "utf8");
  const client = new pg.Client({
    ...getDatabaseConfig(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

function getDatabaseConfig() {
  for (const candidate of [process.env.DIRECT_DATABASE_URL, process.env.DATABASE_URL]) {
    if (!candidate) {
      continue;
    }
    if (candidate.includes("<") || candidate.includes("your-project-ref") || candidate.includes("your-password")) {
      continue;
    }
    const parsed = parsePostgresUrl(candidate);
    if (parsed) {
      return parsed;
    }
  }
  return null;
}

function parsePostgresUrl(raw) {
  raw = raw.trim();
  const schemeEnd = raw.indexOf("://");
  const at = raw.lastIndexOf("@");
  const credentialColon = raw.indexOf(":", schemeEnd + 3);
  if (schemeEnd === -1 || at === -1 || credentialColon === -1 || credentialColon > at) {
    return null;
  }
  const user = raw.slice(schemeEnd + 3, credentialColon);
  const password = raw.slice(credentialColon + 1, at);
  const rest = raw.slice(at + 1);
  const slash = rest.indexOf("/");
  if (slash === -1) {
    return null;
  }
  const hostPort = rest.slice(0, slash);
  const databaseAndParams = rest.slice(slash + 1);
  const database = databaseAndParams.split("?", 1)[0] || "postgres";
  const portColon = hostPort.lastIndexOf(":");
  const host = portColon === -1 ? hostPort : hostPort.slice(0, portColon);
  const port = portColon === -1 ? 5432 : Number(hostPort.slice(portColon + 1));
  if (!host || !Number.isFinite(port)) {
    return null;
  }
  return { host, port, database, user, password };
}

function serviceClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function anonClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function createConfirmedUser(label) {
  const admin = serviceClient();
  const email = `talli-${label}-${randomUUID()}@example.test`;
  const password = `Talli-${randomUUID()}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.ifError(error);
  assert.ok(data.user?.id);
  return { id: data.user.id, email, password };
}

async function signIn(user) {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  assert.ifError(error);
  return client;
}

test(
  "Supabase authenticated workspace persists owner data and denies outsider",
  { skip: hasRequiredEnv() ? false : "Supabase URL/keys or usable DATABASE_URL missing" },
  async () => {
  await applyMigration();
  const admin = serviceClient();
  const ownerUser = await createConfirmedUser("owner");
  const outsiderUser = await createConfirmedUser("outsider");
  const owner = await signIn(ownerUser);
  const outsider = await signIn(outsiderUser);
  const orgNumber = `${Math.floor(100000000 + Math.random() * 899999999)}`;
  let companyId;

  try {
    const { data: company, error: companyError } = await owner
      .from("companies")
      .insert({
        org_number: orgNumber,
        name: "Talli Test Holding AS",
        entity_type: "AS",
        status_text: "aktiv",
        source: "test",
        created_by: ownerUser.id,
        identity_confirmed_at: new Date().toISOString(),
        identity_locked_at: new Date().toISOString(),
      })
      .select("id, org_number, name, created_by")
      .single();
    assert.ifError(companyError);
    assert.equal(company.org_number, orgNumber);
    assert.equal(company.created_by, ownerUser.id);
    companyId = company.id;

    const { error: membershipError } = await owner.from("company_memberships").insert({
      company_id: companyId,
      user_id: ownerUser.id,
      role: "owner",
      accepted_at: new Date().toISOString(),
    });
    assert.ifError(membershipError);

    const { error: auditError } = await owner.from("audit_events").insert({
      company_id: companyId,
      actor_id: ownerUser.id,
      category: "company",
      action: "workspace_created",
      message: "Selskapsarbeidsflate opprettet.",
    });
    assert.ifError(auditError);

    const { data: reloaded, error: reloadError } = await owner
      .from("companies")
      .select("id, org_number, name")
      .eq("id", companyId)
      .single();
    assert.ifError(reloadError);
    assert.equal(reloaded.name, "Talli Test Holding AS");

    const { data: auditRows, error: auditReadError } = await owner
      .from("audit_events")
      .select("action")
      .eq("company_id", companyId);
    assert.ifError(auditReadError);
    assert.deepEqual(
      auditRows.map((row) => row.action),
      ["workspace_created"],
    );

    const { data: outsiderCompanies, error: outsiderCompanyError } = await outsider
      .from("companies")
      .select("id")
      .eq("id", companyId);
    assert.ifError(outsiderCompanyError);
    assert.deepEqual(outsiderCompanies, []);

    const { data: outsiderMemberships, error: outsiderMembershipError } = await outsider
      .from("company_memberships")
      .select("company_id, role")
      .eq("company_id", companyId);
    assert.ifError(outsiderMembershipError);
    assert.deepEqual(outsiderMemberships, []);
  } finally {
    if (companyId) {
      await admin.from("companies").delete().eq("id", companyId);
    }
    await admin.auth.admin.deleteUser(ownerUser.id);
    await admin.auth.admin.deleteUser(outsiderUser.id);
  }
  },
);

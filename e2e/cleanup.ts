import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const LOG = "[e2e-cleanup]";
const MAX_PAGES = 200; // Safety guard: 200 × 50 = 10,000 users max
const E2E_EMAIL_PREFIX = "e2e-";
const E2E_EMAIL_DOMAIN = "@example.com";

function makeAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !key && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `${LOG} Missing required env vars: ${missing.join(", ")}`,
    );
  }

  return createClient(url!, key!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── User lifecycle (CI only) ────────────────────────────────────────────────

export async function createE2eUser(): Promise<void> {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  const missing = [
    !email && "E2E_USER_EMAIL",
    !password && "E2E_USER_PASSWORD",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `${LOG} Missing required env vars: ${missing.join(", ")}`,
    );
  }

  const admin = makeAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: email!,
    password: password!,
    email_confirm: true,
  });

  if (error) {
    throw new Error(`${LOG} createUser failed: ${error.message}`);
  }

  // Grant Pro tier so sync-dependent E2E tests work
  const { error: tierErr } = await admin
    .from("user_profiles")
    .update({ tier: "pro" })
    .eq("id", data.user.id);

  if (tierErr) {
    throw new Error(`${LOG} Failed to set Pro tier: ${tierErr.message}`);
  }

  console.log(`${LOG} Created ephemeral user ${email} (Pro tier)`);
}

export async function deleteE2eUser(): Promise<void> {
  const email = process.env.E2E_USER_EMAIL;

  if (!email) {
    throw new Error(`${LOG} Missing required env var: E2E_USER_EMAIL`);
  }

  const admin = makeAdminClient();

  let userId: string | undefined;
  let page = 1;
  const perPage = 50;

  while (!userId && page <= MAX_PAGES) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(
        `${LOG} listUsers failed on page ${page}: ${error.message}`,
      );
    }

    const users = data.users ?? [];
    const match = users.find((u) => u.email === email);
    if (match) {
      userId = match.id;
      break;
    }

    if (users.length < perPage) {
      console.log(`${LOG} User ${email} not found — already deleted`);
      return;
    }

    page++;
  }

  if (!userId) {
    console.log(`${LOG} User ${email} not found after ${MAX_PAGES} pages`);
    return;
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) {
    throw new Error(`${LOG} deleteUser failed: ${delErr.message}`);
  }

  console.log(`${LOG} Deleted ephemeral user ${email} (${userId})`);
}

export async function cleanupOrphanE2eUsers(): Promise<void> {
  const currentEmail = process.env.E2E_USER_EMAIL;
  const admin = makeAdminClient();

  let page = 1;
  const perPage = 50;
  let orphanCount = 0;

  while (page <= MAX_PAGES) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

    if (error) {
      console.warn(
        `${LOG} listUsers failed on page ${page}: ${error.message}`,
      );
      break;
    }

    const users = data.users ?? [];
    const orphans = users.filter(
      (u) =>
        u.email?.startsWith(E2E_EMAIL_PREFIX) &&
        u.email.endsWith(E2E_EMAIL_DOMAIN) &&
        u.email !== currentEmail,
    );

    for (const orphan of orphans) {
      const { error: delErr } = await admin.auth.admin.deleteUser(orphan.id);
      if (delErr) {
        console.warn(
          `${LOG} Failed to delete orphan ${orphan.email}: ${delErr.message}`,
        );
      } else {
        orphanCount++;
        console.log(`${LOG} Deleted orphan ${orphan.email}`);
      }
    }

    if (users.length < perPage) break;
    page++;
  }

  console.log(
    `${LOG} Orphan cleanup complete — removed ${orphanCount} users`,
  );
}

// ─── Data cleanup ────────────────────────────────────────────────────────────

export async function cleanupE2eData(): Promise<void> {
  const email = process.env.E2E_USER_EMAIL;

  if (!email) {
    throw new Error(
      `${LOG} Missing required env vars: E2E_USER_EMAIL`,
    );
  }

  const admin = makeAdminClient();

  // Resolve user UUID from email — paginate through all users
  let userId: string | undefined;
  let page = 1;
  const perPage = 50;

  while (!userId && page <= MAX_PAGES) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(
        `${LOG} listUsers failed on page ${page}: ${error.message}`,
      );
    }

    const users = data.users ?? [];

    const match = users.find((u) => u.email === email);
    if (match) {
      userId = match.id;
      break;
    }

    // No more pages to check
    if (users.length < perPage) {
      throw new Error(`${LOG} User ${email} not found in auth.users`);
    }

    page++;
  }

  if (!userId) {
    throw new Error(`${LOG} User ${email} not found after ${MAX_PAGES} pages`);
  }

  console.log(`${LOG} Cleaning data for ${email} (${userId})`);

  // 1. Clean storage: list top-level, recurse into subfolders
  try {
    const bucket = admin.storage.from("reference-images");
    const { data: topLevel, error: listErr } = await bucket.list(userId);

    if (listErr) {
      console.warn(`${LOG} Storage list error: ${listErr.message}`);
    } else if (topLevel && topLevel.length > 0) {
      const allPaths: string[] = [];

      for (const item of topLevel) {
        // Items with no id/metadata are folders — recurse one level
        if (!item.id && !item.metadata) {
          const { data: children } = await bucket.list(
            `${userId}/${item.name}`,
          );
          if (children) {
            for (const child of children) {
              allPaths.push(`${userId}/${item.name}/${child.name}`);
            }
          }
        } else {
          allPaths.push(`${userId}/${item.name}`);
        }
      }

      if (allPaths.length > 0) {
        await bucket.remove(allPaths);
        console.log(`${LOG} Removed ${allPaths.length} storage files`);
      }
    }
  } catch (e) {
    console.warn(`${LOG} Storage cleanup failed:`, e);
  }

  // 2. Clean DB in FK-safe order: rolls (cascades frames), then gear
  const tables = ["rolls", "lenses", "cameras", "films"] as const;

  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq("user_id", userId);
    if (error) {
      console.warn(`${LOG} Failed to delete ${table}: ${error.message}`);
    } else {
      console.log(`${LOG} Deleted ${table} rows`);
    }
  }
}

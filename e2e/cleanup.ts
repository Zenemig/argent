import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const LOG = "[e2e-cleanup]";

export async function cleanupE2eData(): Promise<void> {
  const email = process.env.E2E_USER_EMAIL;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [
    !email && "E2E_USER_EMAIL",
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !key && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `${LOG} Missing required env vars: ${missing.join(", ")}`,
    );
  }

  const admin = createClient(url!, key!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Resolve user UUID from email — paginate through all users
  let userId: string | undefined;
  let page = 1;
  const perPage = 50;

  while (!userId) {
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

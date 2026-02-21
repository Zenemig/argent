import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { feedbackPayloadSchema } from "@/lib/schemas";

// ---------------------------------------------------------------------------
// In-memory rate limit (userId → last submission timestamp)
// Acceptable for serverless — worst case a cold start resets the map.
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

/** @internal — for test cleanup only */
export function _resetRateLimits() {
  rateLimitMap.clear();
}

const CATEGORY_LABELS: Record<string, { prefix: string; label: string }> = {
  bug: { prefix: "[Bug]", label: "bug" },
  feature: { prefix: "[Feature]", label: "enhancement" },
  general: { prefix: "[Feedback]", label: "feedback" },
};

export async function POST(request: Request) {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // 2. Parse & validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalidJson" }, { status: 400 });
  }

  const parsed = feedbackPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { category, description, includeEmail, metadata } = parsed.data;

  // 3. Rate limit
  const lastSubmission = rateLimitMap.get(user.id);
  if (lastSubmission && Date.now() - lastSubmission < RATE_LIMIT_MS) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }

  // 4. Fetch user tier
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  const tier = profile?.tier ?? "free";

  // 5. Build issue
  const { prefix, label } = CATEGORY_LABELS[category] ?? CATEGORY_LABELS.general;
  const truncatedDesc = description.length > 60 ? description.slice(0, 57) + "..." : description;
  const title = `${prefix} ${truncatedDesc}`;

  const emailLine = includeEmail && user.email
    ? `- **Email:** ${user.email}`
    : "";

  const issueBody = `${description}

---

<details>
<summary>Metadata</summary>

- **Tier:** ${tier}
- **Browser:** ${metadata.userAgent}
- **Page:** ${metadata.page}
${emailLine}

</details>`;

  const labels = ["feedback"];
  if (label !== "feedback") labels.push(label);

  // 6. Create GitHub issue
  const repo = process.env.GITHUB_FEEDBACK_REPO;
  const token = process.env.GITHUB_FEEDBACK_TOKEN;

  const ghResponse = await fetch(
    `https://api.github.com/repos/${repo}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body: issueBody, labels }),
    },
  );

  if (!ghResponse.ok) {
    console.error("[feedback] GitHub API error:", ghResponse.status);
    return NextResponse.json({ error: "githubError" }, { status: 500 });
  }

  // 7. Record rate limit
  rateLimitMap.set(user.id, Date.now());

  return NextResponse.json({ success: true });
}

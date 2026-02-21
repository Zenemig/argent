import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — must be declared BEFORE the import under test
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { tier: "free" }, error: null }),
        }),
      }),
    }),
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { POST, _resetRateLimits } from "./route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  category: "bug",
  description: "Something is broken when I try to log a shot",
  includeEmail: true,
  metadata: { page: "/roll/abc123", userAgent: "Mozilla/5.0" },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@test.com" } },
    });
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ id: 1, html_url: "https://github.com/..." }), {
        status: 201,
      }),
    );
    _resetRateLimits();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid payload (description too short)", async () => {
    const res = await POST(
      makeRequest({ ...validBody, description: "short" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing category", async () => {
    const { category: _, ...noCategory } = validBody;
    const res = await POST(makeRequest(noCategory));
    expect(res.status).toBe(400);
  });

  it("creates a GitHub issue with correct title and labels for bug", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/repos/");
    expect(url).toContain("/issues");

    const body = JSON.parse(options.body);
    expect(body.title).toContain("[Bug]");
    expect(body.labels).toContain("feedback");
    expect(body.labels).toContain("bug");
  });

  it("creates a GitHub issue with correct title for feature request", async () => {
    const res = await POST(
      makeRequest({ ...validBody, category: "feature" }),
    );
    expect(res.status).toBe(200);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.title).toContain("[Feature]");
    expect(body.labels).toContain("enhancement");
  });

  it("creates a GitHub issue with correct title for general feedback", async () => {
    const res = await POST(
      makeRequest({ ...validBody, category: "general" }),
    );
    expect(res.status).toBe(200);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.title).toContain("[Feedback]");
    expect(body.labels).toContain("feedback");
  });

  it("includes email in body when includeEmail is true", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.body).toContain("test@test.com");
  });

  it("omits email when includeEmail is false", async () => {
    const res = await POST(
      makeRequest({ ...validBody, includeEmail: false }),
    );
    expect(res.status).toBe(200);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.body).not.toContain("test@test.com");
  });

  it("includes metadata in issue body", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.body).toContain("/roll/abc123");
    expect(body.body).toContain("Mozilla/5.0");
  });

  it("returns 500 when GitHub API fails", async () => {
    mockFetch.mockResolvedValue(new Response("", { status: 422 }));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
  });

  it("returns 429 when submitting again within rate limit window", async () => {
    await POST(makeRequest(validBody));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
  });

  it("truncates long descriptions in the issue title", async () => {
    const longDesc = "A".repeat(100);
    const res = await POST(
      makeRequest({ ...validBody, description: longDesc }),
    );
    expect(res.status).toBe(200);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // Title should be capped (prefix + 60 chars max)
    expect(body.title.length).toBeLessThanOrEqual(70);
  });
});

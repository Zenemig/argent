import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

import { sendEmail } from "./client";

describe("sendEmail", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("sends email via Resend", async () => {
    mockSend.mockResolvedValue({ data: { id: "email-123" }, error: null });

    await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    expect(mockSend).toHaveBeenCalledWith({
      from: expect.any(String),
      to: ["user@example.com"],
      subject: "Test",
      html: "<p>Hello</p>",
    });
  });

  it("throws on Resend API error", async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: "Invalid API key", name: "validation_error" },
    });

    await expect(
      sendEmail({
        to: "user@example.com",
        subject: "Test",
        html: "<p>Hello</p>",
      }),
    ).rejects.toThrow("Failed to send email: Invalid API key");
  });
});

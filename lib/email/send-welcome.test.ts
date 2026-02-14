import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSendEmail = vi.fn();

vi.mock("./client", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

import { sendWelcomeEmail } from "./send-welcome";

describe("sendWelcomeEmail", () => {
  beforeEach(() => {
    mockSendEmail.mockReset();
    mockSendEmail.mockResolvedValue(undefined);
  });

  it("sends welcome email with correct subject", async () => {
    await sendWelcomeEmail({ email: "user@example.com" });

    expect(mockSendEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      subject: "Welcome to Argent",
      html: expect.stringContaining("Welcome to Argent!"),
    });
  });

  it("defaults to English locale", async () => {
    await sendWelcomeEmail({ email: "user@example.com" });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Welcome to Argent",
        html: expect.stringContaining("Go to Dashboard"),
      }),
    );
  });

  it("uses Spanish locale when specified", async () => {
    await sendWelcomeEmail({ email: "user@example.com", locale: "es" });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Bienvenido a Argent",
        html: expect.stringContaining("Ir al Panel"),
      }),
    );
  });
});

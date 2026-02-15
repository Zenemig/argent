import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSendEmail = vi.fn();

vi.mock("./client", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

import { sendAccountDeletedEmail } from "./send-account-deleted";

describe("sendAccountDeletedEmail", () => {
  beforeEach(() => {
    mockSendEmail.mockReset();
    mockSendEmail.mockResolvedValue(undefined);
  });

  it("sends account deleted email with correct subject", async () => {
    await sendAccountDeletedEmail({ email: "user@example.com" });

    expect(mockSendEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      subject: "Your Argent account has been deleted",
      html: expect.stringContaining("Account Deleted"),
    });
  });

  it("defaults to English locale", async () => {
    await sendAccountDeletedEmail({ email: "user@example.com" });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Your Argent account has been deleted",
        html: expect.stringContaining("permanently deleted"),
      }),
    );
  });

  it("uses Spanish locale when specified", async () => {
    await sendAccountDeletedEmail({ email: "user@example.com", locale: "es" });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Tu cuenta de Argent ha sido eliminada",
        html: expect.stringContaining("Cuenta Eliminada"),
      }),
    );
  });
});

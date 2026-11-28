import "server-only";
import { readEnv } from "@/lib/config";
import { PlainError } from "@/lib/plain-error";

/** Sends a plain-text operational email through Resend. Never expose the API key in errors. */
export async function sendResendEmail(input: { to: string; subject: string; body: string }): Promise<void> {
  const apiKey = readEnv("RESEND_API_KEY");
  const from = readEnv("EMAIL_FROM");
  if (!apiKey || !from) throw new PlainError("Email delivery is not set up. Add RESEND_API_KEY and EMAIL_FROM.");
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.body }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new PlainError("Email delivery could not be reached. Try again.", { cause: error });
  }
  if (!response.ok) {
    console.error(`[email] Resend returned HTTP ${response.status}`);
    throw new PlainError(`Email delivery failed (${response.status}). Check the Resend domain/from address.`);
  }
}

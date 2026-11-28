import "server-only";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { isMockStt, readEnv } from "@/lib/config";
import { PlainError } from "@/lib/plain-error";
import byText from "@/tests/fixtures/stt/by-text.json";
import ayeshaFixed from "@/tests/fixtures/stt/gate3-ayesha-fixed.json";
import ayeshaMisheard from "@/tests/fixtures/stt/gate3-ayesha-misheard.json";
import sameerMisheard from "@/tests/fixtures/stt/gate3-sameer-misheard.json";
import sameerStillWrong from "@/tests/fixtures/stt/gate3-sameer-still-wrong.json";
import mockTranscript from "@/tests/fixtures/stt/sample-transcript.json";

// Speech-to-text, provider-agnostic (Phase 4). Every provider answers with the
// same Transcript shape: the words heard, each with its start and end time in
// seconds. Captions take their TIMINGS from here and their TEXT from the
// script's display_text (lib/captions.ts). Gate 3 (Phase 5) reuses the same
// transcript, saved to videos.transcript.
//
// Money safety: MOCK_STT remains the default. Real mode currently supports
// Groq Whisper; callers keep the same provider-agnostic Transcript shape.

export const transcriptWordSchema = z
  .object({
    text: z.string().min(1),
    start_s: z.number().min(0),
    end_s: z.number().min(0),
    confidence: z.number().min(0).max(1).optional(),
  })
  .refine((w) => w.end_s >= w.start_s, "A word cannot end before it starts.");

export const transcriptSchema = z.object({
  language: z.string().min(2),
  duration_s: z.number().min(0),
  words: z.array(transcriptWordSchema),
});

export type Transcript = z.infer<typeof transcriptSchema>;
export type TranscriptWord = z.infer<typeof transcriptWordSchema>;
export type SttLanguage = "en" | "ur" | "hi";

export interface SttProvider {
  /**
   * expectedText (p5-a2): the text the voice was asked to say (spoken_text). A real provider may use
   * it as a vocabulary hint; the MOCK uses it to pick a fixture (tests/fixtures/stt/by-text.json).
   */
  transcribe(input: { audioPath: string; language?: SttLanguage; expectedText?: string }): Promise<Transcript>;
}

export const NO_STT_PROVIDER = "No speech-to-text provider is set up yet.";

/**
 * MOCK: the word-timed transcript in tests/fixtures/stt/sample-transcript.json
 * (it matches tests/fixtures/stt/sample-script.json and the 6-second test
 * video). Same answer for every file; nothing leaves the machine.
 */
export const mockSttProvider: SttProvider = {
  async transcribe(input) {
    // p5-a2 (Gate 3): the transcript is picked by the text the voice was asked to say
    // (tests/fixtures/stt/by-text.json), so a re-render with a respelling can "sound" different.
    const keyed = input?.expectedText ? keyedFixture(input.expectedText) : null;
    if (keyed) return keyed;
    // Parsing makes a fresh copy, so a caller can never change the fixture.
    return transcriptSchema.parse(structuredClone(mockTranscript));
  },
};

const GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

const groqWordSchema = z.object({
  word: z.string().min(1),
  start: z.number().min(0),
  end: z.number().min(0),
});

const groqTranscriptSchema = z.object({
  text: z.string().optional(),
  language: z.string().optional(),
  duration: z.number().min(0).optional(),
  words: z.array(groqWordSchema).optional(),
});

/** Real Groq Whisper provider. It returns word timings required by captions and Gate 3. */
export const groqSttProvider: SttProvider = {
  async transcribe(input) {
    const apiKey = readEnv("STT_API_KEY") ?? readEnv("GROQ_API_KEY");
    if (!apiKey) throw new PlainError("Groq STT is not set up. Add STT_API_KEY or GROQ_API_KEY.");

    const bytes = await readFile(input.audioPath);
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: "video/mp4" }), "source.mp4");
    form.append("model", readEnv("STT_MODEL") ?? "whisper-large-v3-turbo");
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "word");
    form.append("timestamp_granularities[]", "segment");
    if (input.language) form.append("language", input.language);
    if (input.expectedText) form.append("prompt", input.expectedText.slice(0, 900));

    let response: Response;
    try {
      response = await fetch(GROQ_STT_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(180_000),
      });
    } catch (error) {
      throw new PlainError("Groq STT could not be reached. Try again.", { cause: error });
    }
    if (!response.ok) {
      console.error(`[stt] Groq returned HTTP ${response.status}`);
      throw new PlainError(`Groq STT failed (${response.status}). Check the API key, model, and audio file.`);
    }

    const parsed = groqTranscriptSchema.safeParse(await response.json());
    if (!parsed.success) throw new PlainError("Groq STT returned an unexpected transcript.", { cause: parsed.error });
    const words = (parsed.data.words ?? []).map((word) => ({
      text: word.word.trim(),
      start_s: word.start,
      end_s: word.end,
    }));
    const duration = parsed.data.duration ?? words.at(-1)?.end_s ?? 0;
    return transcriptSchema.parse({
      language: parsed.data.language ?? input.language ?? "en",
      duration_s: duration,
      words,
    });
  },
};

// p5-b1 (QA SF2): the keyed fixtures are EMBEDDED (static JSON imports, bundled into the app and
// the Trigger.dev build), never read from process.cwd() at run time: a deployed task has no tests/.
// A rule naming a file that is not in this map fails when the module loads (and in the unit tests).
const KEYED_TRANSCRIPTS: Record<string, unknown> = {
  "gate3-ayesha-fixed.json": ayeshaFixed,
  "gate3-ayesha-misheard.json": ayeshaMisheard,
  "gate3-sameer-misheard.json": sameerMisheard,
  "gate3-sameer-still-wrong.json": sameerStillWrong,
};
const byTextSchema = z.object({ rules: z.array(z.object({ contains: z.string().min(1), file: z.string().regex(/^[a-z0-9-]+\.json$/) })) });
const BY_TEXT_RULES = byTextSchema.parse(byText).rules.map((rule) => {
  const fixture = KEYED_TRANSCRIPTS[rule.file];
  if (!fixture) throw new Error(`Mock speech-to-text: ${rule.file} is not embedded in lib/stt.ts.`);
  return { contains: rule.contains.toLowerCase(), transcript: transcriptSchema.parse(fixture) };
});

/** The first by-text rule whose `contains` is in the text (any case), or null. A fresh copy every time. */
function keyedFixture(expectedText: string): Transcript | null {
  const text = expectedText.toLowerCase();
  const rule = BY_TEXT_RULES.find((r) => text.includes(r.contains));
  return rule ? structuredClone(rule.transcript) : null;
}

export function getSttProvider(): SttProvider {
  if (isMockStt()) return mockSttProvider;
  const provider = readEnv("STT_PROVIDER")?.toLowerCase() || (readEnv("GROQ_API_KEY") ? "groq" : "");
  if (provider === "groq") return groqSttProvider;
  throw new PlainError(NO_STT_PROVIDER);
}

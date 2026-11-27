// Never Say It Out Loud — make.fun entry program.
// Writes one line (1-200 chars, UTF-8, not only whitespace) to /output/entry.txt.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const ENTRY =
  "I don't actually understand most of your questions \u2014 I just answer confidently and hope you never check.";

function validateGate(text: string): void {
  const chars = [...text].length;
  if (chars < 1 || chars > 200) {
    throw new Error(`gate failed: entry is ${chars} chars, must be 1-200`);
  }
  if (!/\S/.test(text)) {
    throw new Error("gate failed: entry is only whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("gate failed: entry must be a single line");
  }
  // Fail fast on invisible characters that would break the gate or the judge:
  // no byte-order mark, no control characters other than plain spaces.
  if (text.charCodeAt(0) === 0xfeff) {
    throw new Error("gate failed: entry starts with a BOM");
  }
  for (const ch of text) {
    const code = ch.codePointAt(0) as number;
    if (code < 0x20 && ch !== " " && ch !== "\t") {
      throw new Error("gate failed: entry contains a control character");
    }
  }
  if (text !== text.trim()) {
    throw new Error("gate failed: entry has leading or trailing whitespace");
  }
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes > 800) {
    throw new Error(`gate failed: entry is ${bytes} bytes, must be <= 800`);
  }
  if (Buffer.from(text, "utf8").toString("utf8") !== text) {
    throw new Error("gate failed: entry is not valid UTF-8 round-trip");
  }
}

function emptyOutputDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return;
  }
  // Empty ONLY the contents of /output; never remove the directory itself
  // (it is a mounted directory in the grading sandbox).
  for (const name of readdirSync(dir)) {
    rmSync(`${dir}/${name}`, { recursive: true, force: true });
  }
}

validateGate(ENTRY);
emptyOutputDir("/output");
writeFileSync("/output/entry.txt", ENTRY, "utf8");
const written = readFileSync("/output/entry.txt", "utf8");
if (written !== ENTRY) {
  throw new Error("verification failed: entry.txt does not match the entry");
}
const sha = createHash("sha256").update(written, "utf8").digest("hex");
console.log(`wrote /output/entry.txt (${[...ENTRY].length} chars, ${Buffer.byteLength(ENTRY, "utf8")} bytes, sha256 ${sha})`);

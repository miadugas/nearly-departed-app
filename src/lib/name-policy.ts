// What a display name is allowed to be. Names are user-visible and sync to the
// account, so this is the one gate: impersonation, contact details, slurs, and
// hate/extremist sloganeering stay out. It rejects a name rather than silently
// mangling it, so the user knows why.
//
// Matching runs in two modes on purpose. Long, unambiguous roots match anywhere
// in the name; short ones that live inside ordinary words ("dick" in Dickinson,
// "maga" in Magali, "coon" in Raccoon) must match the whole name. Over-blocking
// a real person's name is a worse failure here than missing a variant.

/** Claiming these implies the name belongs to the app or its staff. */
const RESERVED = [
  "nearlydeparted",
  "nearlydepartedapp",
  "smallparts",
  "smallpartsstudio",
  "admin",
  "administrator",
  "moderator",
  "support",
  "helpdesk",
  "staff",
  "official",
  "team",
  "root",
  "sysadmin",
  "webmaster",
];

/** Long enough to be unmistakable — matched anywhere in the name. */
const BLOCKED_ANYWHERE = [
  // vulgarity
  "fuck",
  "shit",
  "cunt",
  "bitch",
  "bastard",
  "asshole",
  "pussy",
  "whore",
  // slurs
  "nigger",
  "nigga",
  "faggot",
  "tranny",
  "wetback",
  "beaner",
  "towelhead",
  "raghead",
  "zipperhead",
  "halfbreed",
  "retard",
  // hate movements and sloganeering
  "hitler",
  "siegheil",
  "heilhitler",
  "whitepower",
  "whitepride",
  "whitesupremac",
  "kukluxklan",
  "groyper",
  "proudboys",
  "oathkeeper",
  "bloodandsoil",
  "greatreplacement",
  "stopthesteal",
  "buildthewall",
  "fourteenwords",
  "makeamericagreat",
];

/**
 * Short or ambiguous — only rejected when they're the entire name, so
 * Dickinson, Magali, Cassandra, and Raccoon all survive.
 */
const BLOCKED_EXACT = [
  "fag",
  "dick",
  "cock",
  "slut",
  "rape",
  "coon",
  "spic",
  "chink",
  "gook",
  "kike",
  "jap",
  "nazi",
  "kkk",
  "trump",
  "maga",
  "magat",
  "kag",
  "wwg1wga",
  "qanon",
];

/** Numeric hate codes, checked against the digits the user actually typed. */
const BLOCKED_NUMERIC = [/\b1488\b/, /\b14\s*\/?\s*88\b/, /\b88h\b/];

/**
 * Fold a name onto a comparison key: lowercase, strip accents, map common
 * letter/number substitutions, keep letters only.
 */
export function normalizeForPolicy(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/0/g, "o")
    .replace(/@/g, "a")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/7/g, "t")
    .replace(/9/g, "g")
    .replace(/[^a-z]/g, "");
}

/** Same key with runs of a repeated letter collapsed ("fuuuck" → "fuck"). */
export function collapseRuns(key: string): string {
  return key.replace(/(.)\1+/g, "$1");
}

const anywhere = BLOCKED_ANYWHERE.map(normalizeForPolicy);
const anywhereCollapsed = anywhere.map(collapseRuns);
const exact = BLOCKED_EXACT.map(normalizeForPolicy);
const exactCollapsed = exact.map(collapseRuns);
const reserved = RESERVED.map(normalizeForPolicy);

export type NameVerdict =
  | { ok: true; name: string | null }
  | { ok: false; reason: string };

/**
 * Judge a display name the user typed. `null` (cleared) is always allowed —
 * that's how someone goes back to being a Guest.
 */
export function checkDisplayName(raw: string | null | undefined): NameVerdict {
  if (raw == null) return { ok: true, name: null };
  const name = String(raw).trim();
  if (name.length === 0) return { ok: true, name: null };

  if ([...name].length < 2) {
    return { ok: false, reason: "That's a bit short — try two characters." };
  }
  if (/https?:\/\/|www\.|\.(com|net|org|io|co)\b/i.test(name)) {
    return { ok: false, reason: "Names can't contain web addresses." };
  }
  if (/\S+@\S+\.\S+/.test(name)) {
    return { ok: false, reason: "Names can't contain email addresses." };
  }
  if (name.replace(/\D/g, "").length >= 7) {
    return { ok: false, reason: "Names can't contain phone numbers." };
  }
  if (BLOCKED_NUMERIC.some((pattern) => pattern.test(name.toLowerCase()))) {
    return { ok: false, reason: "Pick a different name." };
  }

  // Letters in ANY script — checked before leetspeak folding, which would
  // otherwise turn "123456" into letters and let a digit-only name through.
  if (!/\p{L}/u.test(name)) {
    return { ok: false, reason: "Try a name with some letters in it." };
  }

  // Non-Latin names normalize to an empty key; there's nothing to match them
  // against, and rejecting them would lock out most of the world's names.
  const key = normalizeForPolicy(name);
  if (key.length === 0) return { ok: true, name };
  const collapsed = collapseRuns(key);

  if (reserved.includes(key) || reserved.includes(collapsed)) {
    return { ok: false, reason: "That name is reserved. Pick another." };
  }
  if (
    anywhere.some((root) => key.includes(root)) ||
    anywhereCollapsed.some((root) => collapsed.includes(root))
  ) {
    return { ok: false, reason: "Let's keep it graveyard-appropriate." };
  }
  if (exact.includes(key) || exactCollapsed.includes(collapsed)) {
    return { ok: false, reason: "Let's keep it graveyard-appropriate." };
  }

  return { ok: true, name };
}

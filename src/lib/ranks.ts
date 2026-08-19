// Standing in the archive, earned by how many souls you've kept. The ladder
// runs from idle curiosity to full Mythos scholarship — thresholds tighten
// early (quick wins) and stretch late (something to chase for a long while).
export type Rank = {
  title: string;
  /** Saved-soul count at which this rank begins. */
  at: number;
  /** One line of flavour, shown under the title. */
  blurb: string;
};

export const RANKS: Rank[] = [
  { at: 0, title: "Passerby", blurb: "Just walking through. For now." },
  { at: 1, title: "Curious Visitor", blurb: "The first name always sticks." },
  { at: 3, title: "Investigator", blurb: "You started taking notes." },
  { at: 5, title: "Occultist", blurb: "Some questions answer back." },
  { at: 8, title: "Epitaph Reader", blurb: "You stop for the small print." },
  { at: 12, title: "Archaeologist", blurb: "The ground gives up its dates." },
  { at: 18, title: "Mythos Witness", blurb: "You saw it. You kept walking." },
  {
    at: 25,
    title: "Miskatonic Scholar",
    blurb: "Restricted stacks, unrestricted hours.",
  },
  { at: 35, title: "Cemetourist", blurb: "You know which gates open early." },
  {
    at: 50,
    title: "Arkham Archivist",
    blurb: "Every file cross-referenced twice.",
  },
  {
    at: 70,
    title: "Necronomicon Reader",
    blurb: "You skipped the warning page.",
  },
  { at: 95, title: "Sexton", blurb: "You'd know where to dig. Hypothetically." },
  { at: 125, title: "Grimoire Keeper", blurb: "The margins are yours now." },
  {
    at: 165,
    title: "Preternaturalist",
    blurb: "Natural law is more of a suggestion.",
  },
  { at: 215, title: "Keeper of Names", blurb: "You remember who else forgot." },
  {
    at: 275,
    title: "Keeper of Arcane Lore",
    blurb: "Some of it should stay buried.",
  },
  {
    at: 350,
    title: "Elder Sign Bearer",
    blurb: "What you carry keeps things out.",
  },
  {
    at: 450,
    title: "Keeper of the Register",
    blurb: "The dead keep better company anyway.",
  },
  {
    at: 600,
    title: "Mythos Chronicler",
    blurb: "The record survives the recorder.",
  },
  {
    at: 800,
    title: "Immortal Historian",
    blurb: "Someday they'll put you on a plaque.",
  },
];

export function rankFor(count: number): Rank {
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (n >= rank.at) current = rank;
  }
  return current;
}

/** The next rung, or null once the last one is reached. */
export function nextRank(count: number): Rank | null {
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return RANKS.find((rank) => rank.at > n) ?? null;
}

/** "4 more to Occultist" — or null at the top of the ladder. */
export function progressToNext(count: number): string | null {
  const next = nextRank(count);
  if (!next) return null;
  const remaining = next.at - Math.max(0, Math.floor(count));
  return `${remaining} more to ${next.title}`;
}

/** How far along the current rung you are, 0–1, for a progress bar. */
export function rankProgress(count: number): number {
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const current = rankFor(n);
  const next = nextRank(n);
  if (!next) return 1;
  const span = next.at - current.at;
  return span <= 0 ? 1 : Math.min(1, Math.max(0, (n - current.at) / span));
}

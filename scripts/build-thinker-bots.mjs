#!/usr/bin/env node
/**
 * Build the thinker opponents from the master thinkers database.
 * Reads .thinkers/thinkers.json (written by pull-thinkers.mjs) and writes
 * src/data/thinkerBots.generated.json (gitignored). Always writes the file,
 * as an empty list when the master is unavailable, so the build never breaks.
 *
 * Each thinker is mapped to an existing archetype so it plays with that
 * archetype's card behaviour. Table talk is written in our own words from the
 * thinker's ideas, never as quotes attributed to them.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BOTS = [
  { id: "john-von-neumann", archetype: "The Strategist", playStyle: "game-theoretic", risk: 0.4, aggr: 0.6, adapt: 0.8,
    lines: ["What is your best reply to my best reply?", "Every hand has an equilibrium", "Minimise the maximum loss"] },
  { id: "daniel-kahneman", archetype: "The Analyst", playStyle: "deliberate", risk: 0.3, aggr: 0.4, adapt: 0.7,
    lines: ["Slow down, that was System 1", "The pile looks bigger than it is", "Losses hurt twice as much"] },
  { id: "nassim-nicholas-taleb", archetype: "The Maverick", playStyle: "asymmetric", risk: 0.8, aggr: 0.7, adapt: 0.8,
    lines: ["Small losses, big upside", "You never saw that tail coming", "Skin in the game"] },
  { id: "socrates", archetype: "The Philosopher", playStyle: "questioning", risk: 0.4, aggr: 0.3, adapt: 0.8,
    lines: ["Why did you play that?", "I know only that I hold three cards", "Examine the hand before you play it"] },
  { id: "zhuangzi", archetype: "The Intuitive", playStyle: "wandering", risk: 0.6, aggr: 0.4, adapt: 0.9,
    lines: ["Was that my move or did I dream it?", "The useless card turns out useful", "Go with the flow of the pile"] },
  { id: "confucius", archetype: "The Traditionalist", playStyle: "principled", risk: 0.3, aggr: 0.4, adapt: 0.4,
    lines: ["Play by the proper order", "A fair game honours everyone", "Learn from the last round"] },
  { id: "marcus-aurelius", archetype: "The Peacemaker", playStyle: "stoic", risk: 0.3, aggr: 0.3, adapt: 0.6,
    lines: ["The cards are not mine to control", "Only my reply is mine", "This pile too shall pass"] },
  { id: "federico-fellini", archetype: "The Artist", playStyle: "theatrical", risk: 0.6, aggr: 0.5, adapt: 0.8,
    lines: ["Make it a spectacle", "Every table is a film set", "Dream bigger with this hand"] },
];

const SRC = join(process.cwd(), ".thinkers", "thinkers.json");
const OUT = join(process.cwd(), "src", "data", "thinkerBots.generated.json");

const firstSentence = (s = "") => {
  const clean = String(s).replace(/\s+/g, " ").trim();
  const m = clean.match(/^.*?[.;](\s|$)/);
  const out = (m ? m[0] : clean).replace(/[;\s]+$/, "");
  return /[.!?]$/.test(out) ? out : out + ".";
};
const short = (s = "", n = 34) => {
  const t = String(s).split(/[,;]/)[0].trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
};

let all = [];
if (existsSync(SRC)) {
  const raw = JSON.parse(readFileSync(SRC, "utf8"));
  all = Array.isArray(raw) ? raw : raw.thinkers || [];
}
const byId = new Map(all.map((t) => [t.id, t]));

const out = [];
for (const b of BOTS) {
  const t = byId.get(b.id);
  if (!t) continue;
  out.push({
    name: t.name,
    archetype: b.archetype,
    playStyle: b.playStyle,
    riskTolerance: b.risk,
    aggressiveness: b.aggr,
    adaptability: b.adapt,
    catchphrases: b.lines,
    description: `${t.era}, ${t.domain}. ${firstSentence(t.coreSynthesis)}`,
    bullets: [short(t.domain), short(t.bridgeType ? `${t.bridgeType} thinker` : t.domainCategory), `Plays as ${b.archetype}`],
    thinker: { id: t.id, era: t.era, domain: t.domain },
  });
}

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`[thinkers] ${out.length} thinker opponents written`);

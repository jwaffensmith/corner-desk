import { prisma } from "../src/db.js";

const TRACKS = [
  {
    slug: "js-ts",
    name: "JavaScript & TypeScript Fundamentals",
    description: "Rebuild independent coding: syntax, functions, loops, arrays, objects, async, and language-specific concepts.",
  },
  {
    slug: "cs",
    name: "Computer Science & Algorithms",
    description: "Data structures, algorithms, time and space complexity, memory, networking, and other CS foundations.",
  },
  {
    slug: "leetcode",
    name: "LeetCode & Problem-Solving",
    description: "Progress from basic exercises to LeetCode Easy and Medium problems.",
  },
  {
    slug: "system-design",
    name: "System Design & Architecture",
    description: "API design, databases, caching, scalability, distributed systems, security, reliability, and trade-offs.",
  },
  {
    slug: "agentic",
    name: "Agentic Engineering",
    description: "Orchestration, subagents, skills, context management, MCP, model selection, validation, and evaluation — learned during the workday.",
    weeklyTargetMin: 0,
    countsTowardStudy: false,
  },
];

// Creates missing rows only, so re-running never overwrites edits made in the app.
export async function seed(): Promise<void> {
  for (const [sortOrder, track] of TRACKS.entries()) {
    await prisma.track.upsert({ where: { slug: track.slug }, create: { ...track, sortOrder }, update: {} });
  }
  await prisma.prepSettings.upsert({ where: { id: 1 }, create: {}, update: {} });
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seed()
    .then(() => console.log("Seeded tracks and settings."))
    .finally(() => prisma.$disconnect());
}

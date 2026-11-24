import { prisma } from "../db.js";

const DEFAULT_TRACKS = [
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

export async function provisionUser(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.track.createMany({
      data: DEFAULT_TRACKS.map((track, sortOrder) => ({ ...track, userId, sortOrder })),
      skipDuplicates: true,
    }),
    prisma.prepSettings.createMany({ data: [{ userId }], skipDuplicates: true }),
  ]);
}

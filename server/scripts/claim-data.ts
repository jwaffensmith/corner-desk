import { prisma } from "../src/db.js";

// Data that predates accounts belongs to a placeholder user. Giving that user a real
// email lets the first OAuth sign-in with the same verified email take it over.
const email = process.argv[2]?.trim().toLowerCase();
if (!email?.includes("@")) {
  console.error("Usage: npm run claim-data -w server -- you@example.com");
  process.exit(1);
}

try {
  await prisma.user.update({ where: { id: "legacy-owner" }, data: { email } });
  console.log(`Existing data now belongs to ${email}. Sign in with that email to see it.`);
} catch (err) {
  const code = (err as { code?: string }).code;
  if (code === "P2025") console.error("Nothing to claim: there is no data from before accounts existed.");
  else if (code === "P2002") console.error(`${email} already has an account, so it cannot take over the old data.`);
  else throw err;
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

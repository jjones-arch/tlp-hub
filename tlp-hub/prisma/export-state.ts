import { prisma } from "../src/lib/db";
import { writePublicPagesSnapshot } from "../src/lib/exportPagesState";

async function main() {
  try {
    const result = await writePublicPagesSnapshot();
    console.log(
      `Exported ${result.initiativeCount} initiatives and ${result.sboCount} SBOs to ${result.path}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

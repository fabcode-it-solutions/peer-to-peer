import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.users.update({
    where: {
      domain: "aovmax.io",
    },
    data: {
      password: "$2b$12$Tqt7wl46XGks5qEp4OlUe.xp8g5.FoGOOCsObbc.ugBZOSiDoGUcS",
      role: "superAdmin",
    },
  });

  console.log("Seeded successfully!");
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());

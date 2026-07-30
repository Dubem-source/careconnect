import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Doctor rows need a matching Supabase auth user (authUserId) to log in as
// that doctor. For quick testing, create a doctor user in Supabase Auth
// dashboard first, then paste its UUID below. Patients register normally
// through the app, so no patient seed is needed.
async function main() {
  await prisma.doctor.createMany({
    data: [
      {
        authUserId: "REPLACE_WITH_SUPABASE_AUTH_USER_ID_1",
        fullName: "Smith",
        specialty: "General Medicine",
        phone: "08011111111",
        email: "dr.smith@careconnect.test",
      },
      {
        authUserId: "REPLACE_WITH_SUPABASE_AUTH_USER_ID_2",
        fullName: "Adams",
        specialty: "Pediatrics",
        phone: "08022222222",
        email: "dr.adams@careconnect.test",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seeded doctors.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

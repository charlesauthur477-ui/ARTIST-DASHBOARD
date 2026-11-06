import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  const emailInput = await rl.question("Admin email to reset (default: charlesauthur477@gmail.com): ");
  const email = (emailInput.trim() || "charlesauthur477@gmail.com").toLowerCase();

  const newPassword = await rl.question("Enter new password (min 12 characters): ");
  rl.close();

  if (!newPassword || newPassword.length < 12) {
    console.error("Error: Password must be at least 12 characters long.");
    process.exit(1);
  }

  const db = getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

  if (!user) {
    console.error(`Error: No user found with email ${email}`);
    process.exit(1);
  }

  const passwordHash = await hash(newPassword, 12);
  await db
    .update(schema.adminUsers)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(schema.adminUsers.id, user.id));

  console.log(`\nSuccessfully updated password for ${email}! You can now log in.\n`);
}

main().catch((err) => {
  console.error("Failed to reset password:", err);
  process.exit(1);
});

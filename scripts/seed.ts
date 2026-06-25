import { db } from "../db";
import { tenants } from "../db/schema/tenants";
import { user, account, session } from "../db/schema/auth";
import { users } from "../db/schema/users";
import { randomUUID } from "crypto";

async function seed() {
  console.log("Seeding database...");

  await db.delete(users);
  await db.delete(account);
  await db.delete(session);
  await db.delete(user);
  await db.delete(tenants);
  console.log("Cleaned existing data");

  const tenantId = randomUUID();
  await db.insert(tenants).values({
    id: tenantId,
    name: "Mening Do'konim",
    slug: "mening-dokonim",
  });
  console.log("Tenant created");

  const userId = randomUUID();
  const now = new Date();

  await db.insert(user).values({
    id: userId,
    name: "Admin",
    username: "admin",
    email: "admin@unibiz.uz",
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
    tenantId: tenantId,
    role: "owner",
  });
  console.log("Auth user created");

  const { hashPassword } = await import("@better-auth/utils/password");
  const passwordHash = await hashPassword("admin123");

  await db.insert(account).values({
    id: randomUUID(),
    userId,
    accountId: "admin",
    providerId: "credential",
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  });
  console.log("Account created");

  await db.insert(users).values({
    tenantId,
    username: "admin",
    passwordHash: "",
    fullName: "Admin",
    role: "owner",
  });
  console.log("App user created");

  console.log("Seed complete!");
  console.log("Login: admin / admin123");
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

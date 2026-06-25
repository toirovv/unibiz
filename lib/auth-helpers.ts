import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getSession() {
  const hdrs = await headers();
  return auth.api.getSession({ headers: hdrs });
}

export async function getCurrentTenant() {
  const session = await getSession();
  if (!session?.user?.tenantId) return null;
  return session.user.tenantId as string;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  return session;
}

export async function requireTenant() {
  const tenantId = await getCurrentTenant();
  if (!tenantId) throw new Error("No tenant found");
  return tenantId;
}

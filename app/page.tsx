import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/authz";
import { LOGIN_PATH, homePathForRole } from "@/lib/authz/routes";

export default async function RootPage() {
  const user = await getSessionUser();

  redirect(user ? homePathForRole(user.role) : LOGIN_PATH);
}

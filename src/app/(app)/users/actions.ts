"use server";

import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createUser(formData: FormData) {
  await requireRole(["ADMIN"]);
  const name = String(formData.get("name") || "").trim();
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "SALES") as Role;
  if (!name || !username || !email || !password) {
    throw new Error("كل الحقول مطلوبة");
  }

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { username, name, email, password: hash, role },
  });
  revalidatePath("/users");
  redirect("/users");
}

export async function toggleUser(id: string) {
  await requireRole(["ADMIN"]);
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  await prisma.user.update({
    where: { id },
    data: { active: !user.active },
  });
  revalidatePath("/users");
}

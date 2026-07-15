"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSupplier(formData: FormData) {
  await requireRole(["ADMIN", "STORE"]);
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("الاسم مطلوب");
  await prisma.supplier.create({
    data: {
      name,
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
      address: String(formData.get("address") || "") || null,
      notes: String(formData.get("notes") || "") || null,
    },
  });
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function createCustomer(formData: FormData) {
  await requireRole(["ADMIN", "SALES"]);
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("الاسم مطلوب");
  await prisma.customer.create({
    data: {
      name,
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
      address: String(formData.get("address") || "") || null,
      notes: String(formData.get("notes") || "") || null,
    },
  });
  revalidatePath("/customers");
  redirect("/customers");
}

export async function createCompany(formData: FormData) {
  await requireRole(["ADMIN", "SALES"]);
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("الاسم مطلوب");
  await prisma.company.create({
    data: {
      name,
      taxNumber: String(formData.get("taxNumber") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      email: String(formData.get("email") || "") || null,
      address: String(formData.get("address") || "") || null,
      contactName: String(formData.get("contactName") || "") || null,
      notes: String(formData.get("notes") || "") || null,
    },
  });
  revalidatePath("/companies");
  redirect("/companies");
}

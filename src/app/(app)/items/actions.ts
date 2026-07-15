"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createItem(formData: FormData) {
  await requireRole(["ADMIN", "STORE"]);
  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!code || !name) throw new Error("الكود والاسم مطلوبان");

  await prisma.item.create({
    data: {
      code,
      name,
      description: String(formData.get("description") || "") || null,
      unit: String(formData.get("unit") || "قطعة"),
      sellPrice: Number(formData.get("sellPrice") || 0),
      minStock: Number(formData.get("minStock") || 0),
      avgCost: Number(formData.get("avgCost") || 0),
    },
  });
  revalidatePath("/items");
  redirect("/items");
}

export async function updateItem(id: string, formData: FormData) {
  await requireRole(["ADMIN", "STORE"]);
  await prisma.item.update({
    where: { id },
    data: {
      code: String(formData.get("code") || "").trim(),
      name: String(formData.get("name") || "").trim(),
      description: String(formData.get("description") || "") || null,
      unit: String(formData.get("unit") || "قطعة"),
      sellPrice: Number(formData.get("sellPrice") || 0),
      minStock: Number(formData.get("minStock") || 0),
      active: formData.get("active") === "on",
    },
  });
  revalidatePath("/items");
  redirect("/items");
}

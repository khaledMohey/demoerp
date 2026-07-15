import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(data: {
  username: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const hash = await bcrypt.hash(data.password, 10);
  await prisma.user.upsert({
    where: { username: data.username },
    update: {
      name: data.name,
      email: data.email,
      password: hash,
      role: data.role,
      active: true,
    },
    create: {
      username: data.username,
      name: data.name,
      email: data.email,
      password: hash,
      role: data.role,
    },
  });
}

async function main() {
  await upsertUser({
    username: "admin",
    name: "المدير",
    email: "admin@demoerp.com",
    password: "admin123",
    role: Role.ADMIN,
  });

  await upsertUser({
    username: "store",
    name: "أمين المخزن",
    email: "store@demoerp.com",
    password: "store123",
    role: Role.STORE,
  });

  await upsertUser({
    username: "sales",
    name: "موظف مبيعات",
    email: "sales@demoerp.com",
    password: "sales123",
    role: Role.SALES,
  });

  await upsertUser({
    username: "acc",
    name: "المحاسب",
    email: "acc@demoerp.com",
    password: "acc123",
    role: Role.ACCOUNTANT,
  });

  const cash = await prisma.bankAccount.findFirst({ where: { type: "CASH" } });
  if (!cash) {
    await prisma.bankAccount.create({
      data: {
        name: "الخزنة",
        type: "CASH",
        balance: 0,
        isDefault: true,
      },
    });
  }

  const insta = await prisma.bankAccount.findFirst({ where: { type: "INSTA" } });
  if (!insta) {
    await prisma.bankAccount.create({
      data: {
        name: "إنستا باي",
        type: "INSTA",
        balance: 0,
        isDefault: false,
      },
    });
  }

  const bank = await prisma.bankAccount.findFirst({
    where: { type: "BANK", name: "البنك الأهلي" },
  });
  if (!bank) {
    await prisma.bankAccount.create({
      data: {
        name: "البنك الأهلي",
        type: "BANK",
        accountNo: "1234567890",
        balance: 0,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Admin: admin / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

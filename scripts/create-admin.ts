import { PrismaClient } from "./lib/generated/prisma";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const password = "qwer1234!!";

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 10);

  // 기존 admin 계정이 있는지 확인
  const existingAdmin = await prisma.admin.findUnique({
    where: { username },
  });

  if (existingAdmin) {
    // 기존 계정이 있으면 비밀번호 업데이트
    const updatedAdmin = await prisma.admin.update({
      where: { username },
      data: {
        password: hashedPassword,
        name: "Admin",
        email: "admin@byungskerlog.com",
      },
    });
    console.log("✅ 관리자 계정이 업데이트되었습니다:", updatedAdmin.username);
  } else {
    // 새 관리자 계정 생성
    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        name: "Admin",
        email: "admin@byungskerlog.com",
      },
    });
    console.log("✅ 관리자 계정이 생성되었습니다:", admin.username);
  }

  console.log("Username:", username);
  console.log("Password:", password);
}

main()
  .catch((e) => {
    console.error("❌ 에러 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

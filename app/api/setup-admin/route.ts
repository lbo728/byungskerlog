import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    // 보안을 위해 특정 시크릿 키가 필요하도록 설정
    const { secret } = await request.json();

    if (secret !== process.env.SETUP_SECRET) {
      return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
    }

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

      return NextResponse.json({
        success: true,
        message: "관리자 계정이 업데이트되었습니다.",
        username: updatedAdmin.username,
      });
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

      return NextResponse.json({
        success: true,
        message: "관리자 계정이 생성되었습니다.",
        username: admin.username,
      });
    }
  } catch (error) {
    console.error("관리자 계정 생성 에러:", error);
    return NextResponse.json({ error: "관리자 계정 생성에 실패했습니다.", details: error }, { status: 500 });
  }
}

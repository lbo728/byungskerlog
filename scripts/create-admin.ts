import * as bcrypt from "bcryptjs";

async function main() {
  const password = "qwer1234!!";
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log("\n=== 관리자 계정 정보 ===");
  console.log("Username: admin");
  console.log("Password:", password);
  console.log("\n=== Bcrypt 해시 ===");
  console.log(hashedPassword);
  console.log("\n=== Neon SQL Editor에서 실행할 SQL ===");
  console.log(`
INSERT INTO "Admin" ("id", "username", "password", "name", "email", "createdAt", "updatedAt")
VALUES (
    'admin_' || gen_random_uuid()::text,
    'admin',
    '${hashedPassword}',
    'Admin',
    'admin@byungskerlog.com',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("username") 
DO UPDATE SET 
    "password" = EXCLUDED."password",
    "updatedAt" = CURRENT_TIMESTAMP;
  `);
}

main().catch(console.error);

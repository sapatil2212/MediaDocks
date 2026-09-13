import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SCRYPT_KEYLEN = 64;
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

async function main() {
  console.log("Creating MediaRequest table...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`MediaRequest\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`platform\` VARCHAR(32) NOT NULL,
      \`sourceUrlHash\` VARCHAR(64) NOT NULL,
      \`mediaType\` VARCHAR(16) NULL,
      \`status\` VARCHAR(16) NOT NULL DEFAULT 'resolved',
      \`title\` VARCHAR(255) NULL,
      \`creator\` VARCHAR(190) NULL,
      \`thumbnail\` TEXT NULL,
      \`formats\` JSON NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`expiresAt\` DATETIME(3) NOT NULL,
      UNIQUE INDEX \`MediaRequest_sourceUrlHash_key\`(\`sourceUrlHash\`),
      INDEX \`MediaRequest_expiresAt_idx\`(\`expiresAt\`),
      INDEX \`MediaRequest_platform_idx\`(\`platform\`),
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  console.log("Creating AnalyticsEvent table...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`AnalyticsEvent\` (
      \`id\`           VARCHAR(191) NOT NULL,
      \`type\`         VARCHAR(24)  NOT NULL,
      \`path\`         VARCHAR(191) NULL,
      \`platform\`     VARCHAR(32)  NULL,
      \`mediaKind\`    VARCHAR(16)  NULL,
      \`quality\`      VARCHAR(32)  NULL,
      \`extension\`    VARCHAR(8)   NULL,
      \`status\`       VARCHAR(16)  NOT NULL DEFAULT 'ok',
      \`errorCode\`    VARCHAR(48)  NULL,
      \`durationMs\`   INTEGER      NULL,
      \`bytes\`        INTEGER      NULL,
      \`visitorHash\`  VARCHAR(32)  NOT NULL,
      \`device\`       VARCHAR(16)  NULL,
      \`referrerHost\` VARCHAR(191) NULL,
      \`createdAt\`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX \`AnalyticsEvent_createdAt_idx\`(\`createdAt\`),
      INDEX \`AnalyticsEvent_type_createdAt_idx\`(\`type\`, \`createdAt\`),
      INDEX \`AnalyticsEvent_platform_createdAt_idx\`(\`platform\`, \`createdAt\`),
      INDEX \`AnalyticsEvent_visitorHash_createdAt_idx\`(\`visitorHash\`, \`createdAt\`),
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  console.log("Creating SuperAdmin table...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`SuperAdmin\` (
      \`id\`           VARCHAR(191) NOT NULL,
      \`email\`        VARCHAR(191) NOT NULL,
      \`passwordHash\` VARCHAR(255) NOT NULL,
      \`createdAt\`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      UNIQUE INDEX \`SuperAdmin_email_key\`(\`email\`),
      INDEX \`SuperAdmin_email_idx\`(\`email\`),
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  const adminEmail = "sapdigitechsolutions@gmail.com";
  const adminPass = "Swapnil@2212";
  const passHash = hashPassword(adminPass);

  console.log(`Seeding SuperAdmin (${adminEmail})...`);
  const adminId = "admin_" + crypto.randomBytes(8).toString("hex");
  await prisma.$executeRawUnsafe(
    `INSERT INTO \`SuperAdmin\` (\`id\`, \`email\`, \`passwordHash\`, \`createdAt\`, \`updatedAt\`)
     VALUES (?, ?, ?, NOW(3), NOW(3))
     ON DUPLICATE KEY UPDATE \`passwordHash\` = VALUES(\`passwordHash\`), \`updatedAt\` = NOW(3)`,
    adminId,
    adminEmail,
    passHash,
  );

  console.log("SuperAdmin seeded successfully!");
  console.log("Database initialized successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

-- Adds the AnalyticsEvent table that powers /superadmin.
--
-- Apply this if you manage the schema by hand:
--   mysql -u root -p mediaflow < prisma/analytics-table.sql
--
-- Or let Prisma do it (preferred, and it also verifies the rest of the schema):
--   npx prisma db push
--
-- Safe to run more than once: IF NOT EXISTS means an existing table is left
-- untouched rather than erroring or dropping data.

CREATE TABLE IF NOT EXISTS `AnalyticsEvent` (
    `id`           VARCHAR(191) NOT NULL,
    `type`         VARCHAR(24)  NOT NULL,
    `path`         VARCHAR(191) NULL,
    `platform`     VARCHAR(32)  NULL,
    `mediaKind`    VARCHAR(16)  NULL,
    `quality`      VARCHAR(32)  NULL,
    `extension`    VARCHAR(8)   NULL,
    `status`       VARCHAR(16)  NOT NULL DEFAULT 'ok',
    `errorCode`    VARCHAR(48)  NULL,
    `durationMs`   INTEGER      NULL,
    `bytes`        INTEGER      NULL,
    -- Daily-rotating salted digest. Not an IP, not reversible, not stable
    -- across days.
    `visitorHash`  VARCHAR(32)  NOT NULL,
    `device`       VARCHAR(16)  NULL,
    `referrerHost` VARCHAR(191) NULL,
    `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AnalyticsEvent_createdAt_idx`(`createdAt`),
    INDEX `AnalyticsEvent_type_createdAt_idx`(`type`, `createdAt`),
    INDEX `AnalyticsEvent_platform_createdAt_idx`(`platform`, `createdAt`),
    INDEX `AnalyticsEvent_visitorHash_createdAt_idx`(`visitorHash`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

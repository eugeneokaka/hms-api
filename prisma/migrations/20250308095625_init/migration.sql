/*
  Warnings:

  - You are about to drop the column `totalExpense` on the `finance` table. All the data in the column will be lost.
  - You are about to drop the column `totalIncome` on the `finance` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `transaction` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `transaction` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.
  - Added the required column `updatedAt` to the `Finance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `finance` DROP COLUMN `totalExpense`,
    DROP COLUMN `totalIncome`,
    ADD COLUMN `expenses` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `income` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `netProfit` DECIMAL(65, 30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `transaction` DROP COLUMN `date`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `description` VARCHAR(191) NULL,
    MODIFY `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
    MODIFY `amount` DECIMAL(65, 30) NOT NULL;

-- CreateIndex
CREATE INDEX `Transaction_createdAt_idx` ON `Transaction`(`createdAt`);

-- CreateTable
CREATE TABLE "WorkLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WorkLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkLocation_name_key" ON "WorkLocation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkLocation_code_key" ON "WorkLocation"("code");

ALTER TABLE "Post" ADD COLUMN "university" TEXT;

CREATE TABLE "UniversityArea" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "city" TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL,
  "creatorId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UniversityArea_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UniversityArea_name_key" ON "UniversityArea"("name");

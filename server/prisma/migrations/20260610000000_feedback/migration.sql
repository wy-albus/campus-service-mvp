CREATE TABLE "Feedback" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL DEFAULT '',
  "contact" TEXT NOT NULL DEFAULT '',
  "content" TEXT NOT NULL,
  "submitterId" INTEGER,
  "handled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "handledAt" TIMESTAMP(3),

  CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

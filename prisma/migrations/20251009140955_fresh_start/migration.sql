-- DropForeignKey
ALTER TABLE "public"."Quiz" DROP CONSTRAINT "Quiz_pdfId_fkey";

-- AlterTable
ALTER TABLE "Pdf" ADD COLUMN     "chatId" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "correctAnswerText" TEXT,
ADD COLUMN     "meta" JSONB,
ADD COLUMN     "type" TEXT DEFAULT 'MCQ',
ALTER COLUMN "options" DROP NOT NULL,
ALTER COLUMN "correctIndex" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "chatId" TEXT,
ADD COLUMN     "pdfScope" JSONB,
ALTER COLUMN "pdfId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "quizid" TEXT NOT NULL,
    "chatid" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "breakdown" JSONB,
    "answers" JSONB NOT NULL,
    "createdat" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pdf" ADD CONSTRAINT "pdf_chatid_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_pdfId_fkey" FOREIGN KEY ("pdfId") REFERENCES "Pdf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "quiz_chatid_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_chatid_fkey" FOREIGN KEY ("chatid") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizid_fkey" FOREIGN KEY ("quizid") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

// import { NextResponse } from "next/server";
// import { PrismaClient } from "@/lib/generated/prisma";

// export const runtime = "nodejs";

// const prisma = new PrismaClient();

// /**
//  * Submit quiz answers — score and store attempt
//  */
// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const {
//       quizId,
//       chatId,
//       answers,
//     }: {
//       quizId: string;
//       chatId: string;
//       answers: { questionId: string; answer: string }[];
//     } = body;

//     if (!quizId || !chatId || !answers) {
//       return NextResponse.json(
//         { error: "quizId, chatId, and answers are required" },
//         { status: 400 }
//       );
//     }

//     // 1️⃣ Fetch quiz + questions
//     const quiz = await prisma.quiz.findUnique({
//       where: { id: quizId },
//       include: { questions: true },
//     });

//     if (!quiz) {
//       return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
//     }

//     const userAnswers = new Map(
//       answers.map((a) => [a.questionId, a.answer.trim().toLowerCase()])
//     );

//     let correctCount = 0;
//     const breakdown: Record<string, boolean> = {};

//     // Helper to narrow q.options safely
//     function asStringArray(value: unknown): string[] {
//       return Array.isArray(value)
//         ? (value.filter((v) => typeof v === "string") as string[])
//         : [];
//     }

//     // 2️⃣ Evaluate answers
//     for (const q of quiz.questions) {
//       const userAnswer = userAnswers.get(q.id) || "";
//       let correct = false;

//       if (q.type === "MCQ") {
//         const opts = asStringArray(q.options);
//         const idx = typeof q.correctIndex === "number" ? q.correctIndex : -1;

//         if (idx >= 0 && idx < opts.length) {
//           const correctOption = String(opts[idx]).toLowerCase();
//           correct = userAnswer === correctOption;
//         }
//       } else {
//         const correctText = (q.correctAnswerText ?? "")
//           .toString()
//           .toLowerCase();
//         correct = userAnswer === correctText;
//       }

//       breakdown[q.id] = correct;
//       if (correct) correctCount++;
//     }

//     const total = quiz.questions.length;

//     // 3️⃣ Save attempt
//     const attempt = await prisma.quizAttempt.create({
//       data: {
//         quizid: quiz.id,
//         chatid: chatId,
//         score: correctCount,
//         total,
//         breakdown,
//         answers,
//       },
//     });

//     // 4️⃣ Return result
//     return NextResponse.json({
//       attemptId: attempt.id,
//       score: correctCount,
//       total,
//       percentage: Math.round((correctCount / total) * 100),
//       breakdown,
//     });
//   } catch (err: any) {
//     console.error("quiz/submit error:", err);
//     return NextResponse.json(
//       { error: err.message || "Quiz submission failed" },
//       { status: 500 }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }


import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const prisma = new PrismaClient();
  try {
    const body = await req.json();
    const { chatId, quizId, answers } = body;

    if (!quizId || !chatId || !answers)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    // 🧠 Normalize answers input — handle both Array and Object forms
    let userAnswers: Map<string, string>;
    if (Array.isArray(answers)) {
      userAnswers = new Map(
        answers.map((a: { questionId: string; answer: string }) => [
          a.questionId,
          a.answer?.trim().toLowerCase() ?? "",
        ])
      );
    } else if (typeof answers === "object") {
      userAnswers = new Map(
        Object.entries(answers).map(([questionId, answer]) => [
          questionId,
          (answer as string)?.trim().toLowerCase() ?? "",
        ])
      );
    } else {
      return NextResponse.json({ error: "Invalid answers format" }, { status: 400 });
    }

    // 🔍 Fetch quiz questions
    const questions = await prisma.question.findMany({
      where: { quizId },
      select: {
        id: true,
        type: true,
        text: true,
        options: true,
        correctIndex: true,
        correctAnswerText: true,
      },
    });

    if (questions.length === 0)
      return NextResponse.json({ error: "No questions found" }, { status: 404 });

    // ✅ Scoring logic
    // let correctCount = 0;
    // const detailedResults = questions.map((q) => {
    //   const userAnswer = userAnswers.get(q.id) ?? "";
    //   let correct = false;

    //   if (q.type === "MCQ" && q.options && q.correctIndex !== null) {
    //     const correctOption = Array.isArray(q.options)
    //       ? q.options[q.correctIndex]
    //       : (q.correctAnswerText ?? "");
    //     correct = userAnswer === correctOption?.toLowerCase();
    //   } else {
    //     const correctText = q.correctAnswerText?.toLowerCase()?.trim() ?? "";
    //     correct = userAnswer === correctText;
    //   }

    //   if (correct) correctCount++;

    //   return {
    //     questionId: q.id,
    //     type: q.type,
    //     userAnswer,
    //     correctAnswer: q.correctAnswerText,
    //     correct,
    //   };
    // });
    // ✅ Scoring logic
let correctCount = 0;
const detailedResults = questions.map((q) => {
  const userAnswer = userAnswers.get(q.id) ?? "";
  let correct = false;

  if (q.type === "MCQ" && q.options && q.correctIndex !== null) {
    const correctOption = Array.isArray(q.options)
      ? String(q.options[q.correctIndex]) // ✅ Force cast to string
      : String(q.correctAnswerText ?? "");
    correct = userAnswer === correctOption.toLowerCase().trim();
  } else {
    const correctText = String(q.correctAnswerText ?? "").toLowerCase().trim(); // ✅ Cast before using
    correct = userAnswer === correctText;
  }

  if (correct) correctCount++;

  return {
    questionId: q.id,
    type: q.type,
    userAnswer,
    correctAnswer: String(q.correctAnswerText ?? ""),
    correct,
  };
});



    // ✅ Save attempt
    await prisma.quizAttempt.create({
      data: {
        quizid: quizId,
        chatid: chatId,
        score: correctCount,
        total: questions.length,
        answers: detailedResults,
        breakdown: {
          correctCount,
          total: questions.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      score: correctCount,
      total: questions.length,
      breakdown: detailedResults,
    });
  } catch (err: unknown) {
    console.error("quiz/submit error:", err);
    const errorMessage = err instanceof Error ? err.message : "Quiz submit failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

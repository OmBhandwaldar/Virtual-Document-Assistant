// app/api/quiz/generate/route.ts
import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@/lib/generated/prisma";
import { buildQuizPrompt, safeJsonParse } from "@/lib/prompt";
import { gemini } from "@/lib/gemini";

export const runtime = "nodejs";

type Counts = { mcq: number; saq: number; laq: number };

export async function POST(req: Request) {
  const prisma = new PrismaClient();

  try {
    const body = await req.json();
    const { chatId, counts }: { chatId: string; counts: Counts } = body;

    if (!chatId)
      return NextResponse.json({ error: "chatId required" }, { status: 400 });

    // 1️⃣ Fetch PDFs linked to this chat
    const pdfs = await prisma.pdf.findMany({
      where: { chatId },
      select: { id: true },
    });

    if (pdfs.length === 0)
      return NextResponse.json({ error: "No PDFs found for this chat" }, { status: 400 });

    const pdfIds = pdfs.map((p) => p.id);

    // 2️⃣ Collect context text from chunks (limit size for prompt)
    const chunks = await prisma.chunk.findMany({
      where: { pdfId: { in: pdfIds } },
      select: { text: true, page: true },
      orderBy: { page: "asc" },
      take: 200,
    });

    if (chunks.length === 0)
      return NextResponse.json({ error: "No chunks found" }, { status: 400 });

    const context = chunks
      .map((c) => `[page ${c.page}] ${c.text}`)
      .join("\n")
      .slice(0, 12_000);

    // 3️⃣ Ask Gemini to generate quiz questions in JSON format
    const prompt = buildQuizPrompt(context, counts);

    const result = await gemini.models.generateContent({
      model: "models/gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const rawOutput = result.text ?? "";
    // const rawOutput = result.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = safeJsonParse<{
      mcq?: { question: string; options: string[]; correct_index: number; explanation?: string }[];
      saq?: { question: string; answer: string; explanation?: string }[];
      laq?: { question: string; answer_outline: string; explanation?: string }[];
    }>(rawOutput);

    if (!parsed) {
      return NextResponse.json({ error: "Failed to parse model output" }, { status: 500 });
    }

    // 4️⃣ Create Quiz (chat-level, pdfId optional)
    const quiz = await prisma.quiz.create({
      data: {
        chatId,
        pdfScope: pdfIds,
        type: "mixed",
      },
    });

    // 5️⃣ Prepare Questions for DB insertion
    const questionRows = [
      ...(parsed.mcq ?? []).map((m) => ({
        quizId: quiz.id,
        type: "MCQ",
        text: m.question,
        options: m.options ?? Prisma.JsonNull,
        // options: m.options,
        correctIndex: m.correct_index ?? null,
        correctAnswerText: m.options?.[m.correct_index] ?? null,
        explanation: m.explanation ?? "",
      })),
      ...(parsed.saq ?? []).map((s) => ({
        quizId: quiz.id,
        type: "SAQ",
        text: s.question,
        options: Prisma.JsonNull,
        // options: null,
        correctIndex: null,
        correctAnswerText: s.answer,
        explanation: s.explanation ?? "",
      })),
      ...(parsed.laq ?? []).map((l) => ({
        quizId: quiz.id,
        type: "LAQ",
        text: l.question,
        options: Prisma.JsonNull,
        // options: null,
        correctIndex: null,
        correctAnswerText: l.answer_outline,
        explanation: l.explanation ?? "",
      })),
    ];

    if (questionRows.length === 0)
      return NextResponse.json({ error: "No questions generated" }, { status: 500 });

    await prisma.question.createMany({ data: questionRows });

    // 6️⃣ Send questions to UI
    const uiQuestions = questionRows.map((q, i) => ({
      id: `q_${i}`,
      type: q.type as "MCQ" | "SAQ" | "LAQ",
      question: q.text,
      options: q.options ?? undefined,
    //   correctAnswer:
    //     q.type === "MCQ"
    //       ? (q.options[q.correctIndex])
    //     //   ? (q.options?.[q.correctIndex ?? -1] ?? "")
    //       : (q.correctAnswerText ?? ""),
        correctAnswer:
        q.type === "MCQ" &&
        Array.isArray(q.options) &&
        typeof q.correctIndex === "number"
            ? q.options[q.correctIndex]
            : q.correctAnswerText ?? "",

      explanation: q.explanation,
    }));

    return NextResponse.json({ quizId: quiz.id, questions: uiQuestions });
  } catch (err: unknown) {
    console.error("❌ quiz/generate error:", err);
    const errorMessage = err instanceof Error ? err.message : "Generate failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

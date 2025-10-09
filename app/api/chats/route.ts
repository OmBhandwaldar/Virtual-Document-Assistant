import { NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export const runtime = "nodejs";

// ✅ Create new chat
export async function POST(req: Request) {
  try {
    const { title } = await req.json();

    const chat = await prisma.chat.create({
      data: {
        title: title || "New Chat",
      },
    });

    return NextResponse.json(chat, { status: 201 });
  } catch (err: unknown) {
    console.error("Chat creation error:", err);
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// (optional)
export async function GET() {
  try {
    const chats = await prisma.chat.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(chats);
  } catch (err: unknown) {
    console.error("Error fetching chats:", err);
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

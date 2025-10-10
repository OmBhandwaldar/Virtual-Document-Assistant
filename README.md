# BeyondChats Assignment — AI-Powered Learning Assistant([Live App](https://virtual-document-assistant-fkj9.vercel.app/))([Demo Video](https://drive.google.com/file/d/1JWB3EN4FlL6XKZiTanmKvzipE2UXHdNI/view?usp=drive_link))

### Built by Om Bhandwaldar

---

## Overview

This project is an AI-powered Learning Assistant that enables students to upload, view, and interact with their study materials.
It supports PDF ingestion, quiz generation, progress tracking, and Retrieval-Augmented Generation (RAG) based intelligent Q&A.

Students/Users can upload course PDFs (like NCERT Physics books), generate quizzes, attempt them, track performance, and even chat with an AI tutor - all in one modern interface.

---

## Features


| Feature               | Description                                                                                                                  
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- 
| Source Selector       | Allows selecting between All PDFs or specific PDFs. Supports uploading new PDFs for embedding and quiz generation.          
| PDF Viewer            | Integrated viewer with zoom, pagination, and responsive layout beside chat.                                                   
| Quiz Generator Engine | Uses Gemini API to generate MCQs, SAQs, and LAQs. Automatically evaluates answers, provides explanations, and stores results. 
| Progress Tracking     | Tracks performance per chat (QuizAttempt table) with score, breakdown, and history.                                          
| Chat UI (Virtual Tutor) | ChatGPT-style interface with a sidebar for managing multiple chats.                                                        
| RAG Answers with Citations | AI answers user questions with page citations and quoted text from uploaded PDFs using pgvector similarity search.




---

## Tech Stack

| Layer      | Tools / Frameworks                                          |
| ---------- | ----------------------------------------------------------- |
| Frontend   | Next.js 14 (App Router), TypeScript, TailwindCSS, ShadCN/UI |
| Backend    | Next.js API Routes                              |
| Database   | Supabase PostgreSQL with pgvector                           |
| ORM        | Prisma ORM                                                  |
| AI / LLM   | Google Gemini API (Gemini 2.0 Flash + Embedding 001)        |
| Storage    | Supabase Storage                                            |
| Deployment | Vercel                                                      |


---

## Getting Started: High-Level Workflow

1. **Click "New Chat"** to create a chat session.  
2. **Select the chat** from the sidebar.  
3. **Go to the "PDFs" tab** in the sidebar.  
4. **Upload one or more PDFs** (one by one).  
5. **Ask questions** in the chat box.  
6. **Click "Generate Quiz"** to create a quiz from PDFs.  
7. **Repeat quiz generation** as needed.  
8. **View progress** in the "Progress" tab.


---

## About the RAG Pipeline

The system uses a Retrieval-Augmented Generation (RAG) approach to generate contextual answers and quizzes.

### RAG Flow

1. **PDF Upload:** Users upload PDFs to Supabase storage.
2. **Chunking:** The text is extracted and split into small chunks (~500-800 tokens).
3. **Embedding:** Each chunk is converted into a 1536-dimensional vector using `gemini-embedding-001`.
4. **Storage:** The embeddings are stored in a Supabase (PostgreSQL) table with `pgvector(1536)` column.
5. **Retrieval:** When the user asks a question, the most relevant chunks are retrieved via cosine similarity search.
6. **Generation:** The retrieved context is combined with the question and sent to Gemini Flash 2.0 to produce contextual answers with citations.

This enables precise, explainable, and source-grounded responses.


---

## Architecture

```
User Uploads PDF → Stored in Supabase
          ↓
PDF Text Extracted → Chunked
          ↓
Gemini Embedding Model → Vector(1536)
          ↓
Stored in pgvector table "embeddings"
          ↓
RAG Query → Retrieve Similar Chunks
          ↓
Gemini Flash → Generate Contextual Answer or Quiz
          ↓
Frontend Displays → PDF, Chat, Quiz, Progress
```

---

## Database Schema

| Table       | Purpose                                      |
| ----------- | -------------------------------------------- |
| Pdf         | Stores metadata of uploaded PDFs             |
| Chunk       | Stores text chunks from PDFs                 |
| embeddings  | Stores embeddings of chunks (vector(1536))   |
| Quiz        | Stores quiz info per chat                    |
| Question    | Individual questions (MCQ, SAQ, LAQ)         |
| QuizAttempt | Records user quiz attempts, score, breakdown |
| Chat        | Chat session per user                        |
| Message     | Chat messages for AI Q&A                     |

---

## Core Backend APIs

### `/api/upload`

* Handles PDF upload to Supabase storage.
* Extracts text, creates chunks, generates embeddings, and stores them in DB.

### `/api/quiz/generate`

* Generates quizzes (MCQ/SAQ/LAQ) from all PDFs of the chat.
* Stores generated questions in Quiz and Question tables.

### `/api/quiz/submit`

* Evaluates user answers.
* Stores attempts in QuizAttempt.

### `/api/chat/query`

* Accepts a question, retrieves top-matching chunks from embeddings, and generates contextual answer with citations.

---

## Local Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/OmBhandwaldar/Virtual-Document-Assistant.git
cd Virtual-Document-Assistant
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Variables

Create a `.env` file:

```env
DATABASE_URL=<your-supabase-postgres-url>
GEMINI_API_KEY=<your-gemini-api-key>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Step 4: Enable pgvector on Supabase

Run this in Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 5: Create embeddings Table

```sql
CREATE TABLE embeddings (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  pdf_id text REFERENCES "Pdf"(id) ON DELETE CASCADE,
  chunk_id text REFERENCES "Chunk"(id) ON DELETE CASCADE,
  content text,
  page int,
  created_at timestamptz DEFAULT now(),
  embedding vector(1536)
);

CREATE INDEX IF NOT EXISTS embeddings_embedding_cos_idx
ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Step 6: Prisma Setup

```bash
npx prisma generate
```

### Step 7: Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)


---

## Progress Tracking

Each quiz submission is stored as a QuizAttempt:

* Tracks score, total, answers, and breakdown.
* Used to compute overall learning progress.
* Enables the user to review mistakes and explanations.


---

## Design Choices

| Decision                   | Reason                                           |
| -------------------------- | ------------------------------------------------ |
| Next.js App Router         | Simplifies API and frontend integration          |
| Gemini over OpenAI         | Better embedding integration and cost efficiency |
| Supabase Database/Storage | Easier management + built-in Postgres            |
| Manual chunking trigger    | Easier control for debugging                     |
| Vector size 1536           | Compatible with Gemini embeddings                |

---

## Future Enhancements

* One-click flowchart generation
* Export quiz results to PDF
* Multi-user authentication
* YouTube video recommender from YouTube API


---

## Development Summary

* Duration: 3 Days
* Approach: Step-by-step development of RAG → PDF handling → quiz generation → scoring.
* Tools Used: ChatGPT, Supabase SQL Editor, Prisma Studio, Gemini API, Vercel.
* Tested using NCERT Class XI Physics PDFs.

---

## Author

**Om Bhandwaldar**
Full Stack Web Developer | Next.js | Node.js | PostgreSQL | DevOps | AWS
Email: [ombhandwaldar@example.com](mailto:bhandwaldarom15@gmail.com)
LinkedIn: [linkedin.com/in/ombhandwaldar](https://linkedin.com/in/ombhandwaldar)


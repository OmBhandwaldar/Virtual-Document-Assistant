"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  type: "MCQ" | "SAQ" | "LAQ";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizGeneratorProps {
  onBack: () => void;
  onSaveProgress: (
    score: number,
    total: number,
    answers: any[],
    questionTypes: { mcq: number; saq: number; laq: number }
  ) => void;
  chatId: string;
}

export default function QuizGenerator({
  onBack,
  onSaveProgress,
  chatId,
}: QuizGeneratorProps) {
  const [configStep, setConfigStep] = useState(true);
  const [numMCQ, setNumMCQ] = useState(2);
  const [numSAQ, setNumSAQ] = useState(1);
  const [numLAQ, setNumLAQ] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** ✅ Step 1: Generate quiz from backend */
  const handleStartQuiz = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          counts: { mcq: numMCQ, saq: numSAQ, laq: numLAQ },
        }),
      });

      if (!res.ok) throw new Error("Failed to generate quiz");

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions returned from backend");
      }

      setQuizId(data.quizId);
      setQuestions(data.questions);
      setConfigStep(false);
      setQuizStarted(true);
      setCurrentQuestion(0);
      setAnswers({});
      setSubmitted(false);
      setScore(0);
    } catch (err: any) {
      setError(err.message || "Failed to start quiz");
    } finally {
      setLoading(false);
    }
  };

  /** ✅ Step 2: Track user answers */
  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  /** ✅ Step 3: Submit answers to backend */
  const handleSubmit = async () => {
    try {
      if (!quizId) {
        setError("Quiz ID missing — please regenerate the quiz.");
        return;
      }

      setLoading(true);
      setError("");

      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          quizId,
          answers,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit quiz");

      const data = await res.json();
      setScore(data.score);
      setSubmitted(true);

      onSaveProgress(data.score, data.total, Object.entries(answers), {
        mcq: numMCQ,
        saq: numSAQ,
        laq: numLAQ,
      });
    } catch (err: any) {
      setError(err.message || "Error submitting quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToConfig = () => {
    setConfigStep(true);
    setQuizStarted(false);
    setSubmitted(false);
    setQuestions([]);
  };

  /** ✅ Step 4: UI States — Loading / Error */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-b from-purple-50 to-blue-50">
        <Sparkles className="h-10 w-10 text-purple-600 mb-4 animate-spin" />
        <p className="text-lg font-semibold text-gray-700">
          {submitted ? "Scoring your quiz..." : "Generating your quiz..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-b from-red-50 to-orange-50">
        <XCircle className="h-10 w-10 text-red-500 mb-4" />
        <p className="text-lg text-gray-700 mb-4">{error}</p>
        <Button onClick={handleBackToConfig} className="rounded-lg">
          Try Again
        </Button>
      </div>
    );
  }

  /** ✅ Step 5: Configuration UI */
  if (configStep) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 to-blue-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <Button variant="ghost" onClick={onBack} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">Quiz Generator</h2>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-2xl w-full p-8 bg-white shadow-xl rounded-2xl border-0">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </div>

            <h3 className="text-3xl font-bold text-center mb-4 text-gray-900">
              Configure Your Quiz
            </h3>
            <p className="text-center text-gray-600 mb-8">
              Choose how many questions you want for each type
            </p>

            <div className="space-y-6 mb-8">
              {/* MCQs */}
              <div className="bg-purple-50 rounded-xl p-6">
                <Label htmlFor="mcq-count" className="text-lg font-semibold mb-2 block">
                  MCQs
                </Label>
                <Input
                  id="mcq-count"
                  type="number"
                  min="0"
                  max="10"
                  value={numMCQ}
                  onChange={(e) =>
                    setNumMCQ(Math.max(0, parseInt(e.target.value) || 0))
                  }
                />
              </div>

              {/* SAQs */}
              <div className="bg-blue-50 rounded-xl p-6">
                <Label htmlFor="saq-count" className="text-lg font-semibold mb-2 block">
                  SAQs
                </Label>
                <Input
                  id="saq-count"
                  type="number"
                  min="0"
                  max="10"
                  value={numSAQ}
                  onChange={(e) =>
                    setNumSAQ(Math.max(0, parseInt(e.target.value) || 0))
                  }
                />
              </div>

              {/* LAQs */}
              <div className="bg-indigo-50 rounded-xl p-6">
                <Label htmlFor="laq-count" className="text-lg font-semibold mb-2 block">
                  LAQs
                </Label>
                <Input
                  id="laq-count"
                  type="number"
                  min="0"
                  max="10"
                  value={numLAQ}
                  onChange={(e) =>
                    setNumLAQ(Math.max(0, parseInt(e.target.value) || 0))
                  }
                />
              </div>
            </div>

            <Button
              onClick={handleStartQuiz}
              disabled={numMCQ + numSAQ + numLAQ === 0 || loading}
              className="w-full h-14 text-lg rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Generate & Start Quiz
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  /** ✅ Step 6: Display Quiz Questions */
  if (submitted) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 to-blue-50 p-8 text-center">
        <Card className="p-10 bg-white rounded-2xl shadow-xl max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
          <p className="text-lg text-gray-600 mb-6">
            You scored <b>{score}</b> out of <b>{questions.length}</b> ({percentage}%)
          </p>
          <Button
            onClick={handleBackToConfig}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> New Quiz
          </Button>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 to-blue-50 p-6">
      <h3 className="text-xl font-semibold mb-4">
        Question {currentQuestion + 1} / {questions.length}
      </h3>
      <Card className="p-6 bg-white shadow-xl rounded-2xl border-0">
        <p className="text-lg font-semibold mb-4">{question.question}</p>
        {question.type === "MCQ" && question.options ? (
          <RadioGroup
            value={answers[question.id] || ""}
            onValueChange={(v) => handleAnswerChange(question.id, v)}
          >
            {question.options.map((opt, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center space-x-3 p-3 border-2 rounded-xl cursor-pointer hover:border-purple-400",
                  answers[question.id] === opt
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-200"
                )}
              >
                <RadioGroupItem value={opt} id={`option-${idx}`} />
                <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <Textarea
            placeholder="Type your answer..."
            value={answers[question.id] || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="min-h-[150px]"
          />
        )}
      </Card>

      <div className="flex gap-3 mt-6">
        {currentQuestion > 0 && (
          <Button onClick={() => setCurrentQuestion((p) => p - 1)} variant="outline">
            Previous
          </Button>
        )}
        {currentQuestion < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQuestion((p) => p + 1)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
          >
            Submit Quiz
          </Button>
        )}
      </div>
    </div>
  );
}



// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Textarea } from "@/components/ui/textarea";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import {
//   ArrowLeft,
//   CheckCircle2,
//   XCircle,
//   RefreshCw,
//   Sparkles,
// } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface Question {
//   id: string;
//   type: "MCQ" | "SAQ" | "LAQ";
//   question: string;
//   options?: string[];
//   correctAnswer: string;
//   explanation: string;
// }

// interface QuizGeneratorProps {
//   onBack: () => void;
//   onSaveProgress: (score: number, total: number, answers: any[], questionTypes: { mcq: number; saq: number; laq: number }) => void;
//   chatId: string;
// }

// export default function QuizGenerator({
//   onBack,
//   onSaveProgress,
//   chatId,
// }: QuizGeneratorProps) {
//   const [configStep, setConfigStep] = useState(true);
//   const [numMCQ, setNumMCQ] = useState(2);
//   const [numSAQ, setNumSAQ] = useState(1);
//   const [numLAQ, setNumLAQ] = useState(0);
//   const [questions, setQuestions] = useState<Question[]>([]);
//   const [quizStarted, setQuizStarted] = useState(false);
//   const [currentQuestion, setCurrentQuestion] = useState(0);
//   const [answers, setAnswers] = useState<Record<string, string>>({});
//   const [submitted, setSubmitted] = useState(false);
//   const [score, setScore] = useState(0);

//   // Generate mock questions based on configuration
//   const generateQuestions = () => {
//     const mockMCQs: Question[] = [
//       {
//         id: "mcq1",
//         type: "MCQ",
//         question: "What is the capital of France?",
//         options: ["London", "Berlin", "Paris", "Madrid"],
//         correctAnswer: "Paris",
//         explanation: "Paris is the capital and largest city of France.",
//       },
//       {
//         id: "mcq2",
//         type: "MCQ",
//         question: "Which planet is known as the Red Planet?",
//         options: ["Venus", "Mars", "Jupiter", "Saturn"],
//         correctAnswer: "Mars",
//         explanation: "Mars is called the Red Planet due to its reddish appearance.",
//       },
//       {
//         id: "mcq3",
//         type: "MCQ",
//         question: "What is the chemical symbol for water?",
//         options: ["H2O", "CO2", "O2", "N2"],
//         correctAnswer: "H2O",
//         explanation: "Water is composed of two hydrogen atoms and one oxygen atom.",
//       },
//     ];

//     const mockSAQs: Question[] = [
//       {
//         id: "saq1",
//         type: "SAQ",
//         question: "Explain the process of photosynthesis in plants.",
//         correctAnswer: "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of sugar.",
//         explanation: "A complete answer should mention sunlight, water, CO2, chlorophyll, and the products (oxygen and glucose).",
//       },
//       {
//         id: "saq2",
//         type: "SAQ",
//         question: "What is Newton's First Law of Motion?",
//         correctAnswer: "An object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force.",
//         explanation: "This law describes inertia and the tendency of objects to maintain their state of motion.",
//       },
//     ];

//     const mockLAQs: Question[] = [
//       {
//         id: "laq1",
//         type: "LAQ",
//         question: "Discuss the causes and effects of climate change.",
//         correctAnswer: "Climate change is caused by greenhouse gas emissions, deforestation, and industrial activities. Effects include rising temperatures, melting ice caps, extreme weather events, and threats to biodiversity.",
//         explanation: "A comprehensive answer should cover both natural and human causes, as well as environmental, economic, and social impacts.",
//       },
//       {
//         id: "laq2",
//         type: "LAQ",
//         question: "Explain the theory of evolution by natural selection.",
//         correctAnswer: "Evolution by natural selection involves variation in traits, competition for resources, survival of the fittest, and inheritance of beneficial traits over generations.",
//         explanation: "Should mention Charles Darwin, adaptation, survival advantages, and how species change over time.",
//       },
//     ];

//     const selectedQuestions: Question[] = [];
    
//     // Add MCQs
//     for (let i = 0; i < Math.min(numMCQ, mockMCQs.length); i++) {
//       selectedQuestions.push(mockMCQs[i]);
//     }
    
//     // Add SAQs
//     for (let i = 0; i < Math.min(numSAQ, mockSAQs.length); i++) {
//       selectedQuestions.push(mockSAQs[i]);
//     }
    
//     // Add LAQs
//     for (let i = 0; i < Math.min(numLAQ, mockLAQs.length); i++) {
//       selectedQuestions.push(mockLAQs[i]);
//     }

//     return selectedQuestions;
//   };

//   const handleStartQuiz = () => {
//     const generatedQuestions = generateQuestions();
//     setQuestions(generatedQuestions);
//     setConfigStep(false);
//     setQuizStarted(true);
//     setCurrentQuestion(0);
//     setAnswers({});
//     setSubmitted(false);
//     setScore(0);
//   };

//   const handleAnswerChange = (questionId: string, answer: string) => {
//     setAnswers((prev) => ({ ...prev, [questionId]: answer }));
//   };

//   const handleSubmit = () => {
//     let correctCount = 0;
//     questions.forEach((q) => {
//       if (answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
//         correctCount++;
//       }
//     });
//     setScore(correctCount);
//     setSubmitted(true);
//     onSaveProgress(correctCount, questions.length, Object.entries(answers), {
//       mcq: numMCQ,
//       saq: numSAQ,
//       laq: numLAQ,
//     });
//   };

//   const isAnswerCorrect = (questionId: string) => {
//     const question = questions.find((q) => q.id === questionId);
//     if (!question) return false;
//     return (
//       answers[questionId]?.toLowerCase().trim() ===
//       question.correctAnswer.toLowerCase().trim()
//     );
//   };

//   const handleBackToConfig = () => {
//     setConfigStep(true);
//     setQuizStarted(false);
//     setSubmitted(false);
//   };

//   // Configuration Step
//   if (configStep) {
//     return (
//       <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 to-blue-50">
//         <div className="p-4 border-b border-gray-200 bg-white">
//           <Button variant="ghost" onClick={onBack} className="mb-2">
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Chat
//           </Button>
//           <h2 className="text-2xl font-bold text-gray-900">Quiz Generator</h2>
//         </div>

//         <div className="flex-1 flex items-center justify-center p-8">
//           <Card className="max-w-2xl w-full p-8 bg-white shadow-xl rounded-2xl border-0">
//             <div className="flex justify-center mb-6">
//               <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
//                 <Sparkles className="h-10 w-10 text-white" />
//               </div>
//             </div>

//             <h3 className="text-3xl font-bold text-center mb-4 text-gray-900">
//               Configure Your Quiz
//             </h3>
//             <p className="text-center text-gray-600 mb-8">
//               Choose how many questions you want for each type
//             </p>

//             <div className="space-y-6 mb-8">
//               {/* MCQ Configuration */}
//               <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
//                 <Label htmlFor="mcq-count" className="text-lg font-semibold text-gray-900 mb-2 block">
//                   Multiple Choice Questions (MCQs)
//                 </Label>
//                 <Input
//                   id="mcq-count"
//                   type="number"
//                   min="0"
//                   max="10"
//                   value={numMCQ}
//                   onChange={(e) => setNumMCQ(Math.max(0, parseInt(e.target.value) || 0))}
//                   className="text-lg h-12 rounded-lg"
//                 />
//               </div>

//               {/* SAQ Configuration */}
//               <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
//                 <Label htmlFor="saq-count" className="text-lg font-semibold text-gray-900 mb-2 block">
//                   Short Answer Questions (SAQs)
//                 </Label>
//                 <Input
//                   id="saq-count"
//                   type="number"
//                   min="0"
//                   max="10"
//                   value={numSAQ}
//                   onChange={(e) => setNumSAQ(Math.max(0, parseInt(e.target.value) || 0))}
//                   className="text-lg h-12 rounded-lg"
//                 />
//               </div>

//               {/* LAQ Configuration */}
//               <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6">
//                 <Label htmlFor="laq-count" className="text-lg font-semibold text-gray-900 mb-2 block">
//                   Long Answer Questions (LAQs)
//                 </Label>
//                 <Input
//                   id="laq-count"
//                   type="number"
//                   min="0"
//                   max="10"
//                   value={numLAQ}
//                   onChange={(e) => setNumLAQ(Math.max(0, parseInt(e.target.value) || 0))}
//                   className="text-lg h-12 rounded-lg"
//                 />
//               </div>
//             </div>

//             <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4 mb-6 text-center">
//               <p className="text-sm text-gray-700">
//                 <span className="font-semibold">Total Questions: </span>
//                 <span className="text-2xl font-bold text-purple-700">{numMCQ + numSAQ + numLAQ}</span>
//               </p>
//             </div>

//             <Button
//               onClick={handleStartQuiz}
//               disabled={numMCQ + numSAQ + numLAQ === 0}
//               className="w-full h-14 text-lg rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg disabled:opacity-50"
//             >
//               Generate & Start Quiz
//             </Button>
//           </Card>
//         </div>
//       </div>
//     );
//   }

//   if (submitted) {
//     const percentage = Math.round((score / questions.length) * 100);

//     return (
//       <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 to-blue-50">
//         <div className="p-4 border-b border-gray-200 bg-white">
//           <Button variant="ghost" onClick={onBack}>
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Chat
//           </Button>
//         </div>

//         <ScrollArea className="flex-1">
//           <div className="max-w-3xl mx-auto p-8">
//             <Card className="p-8 bg-white shadow-xl rounded-2xl border-0 mb-6">
//               <div className="text-center mb-6">
//                 <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
//                   <span className="text-4xl font-bold text-white">
//                     {percentage}%
//                   </span>
//                 </div>
//                 <h3 className="text-3xl font-bold text-gray-900 mb-2">
//                   Quiz Complete!
//                 </h3>
//                 <p className="text-xl text-gray-600">
//                   You scored {score} out of {questions.length}
//                 </p>
//               </div>

//               <div className="flex gap-3">
//                 <Button
//                   onClick={handleBackToConfig}
//                   className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
//                 >
//                   <RefreshCw className="h-4 w-4 mr-2" />
//                   New Quiz
//                 </Button>
//                 <Button
//                   onClick={onBack}
//                   variant="outline"
//                   className="flex-1 h-12 rounded-xl"
//                 >
//                   <ArrowLeft className="h-4 w-4 mr-2" />
//                   Back to Chat
//                 </Button>
//               </div>
//             </Card>

//             <h4 className="text-xl font-bold text-gray-900 mb-4">Review Answers</h4>
//             <div className="space-y-4">
//               {questions.map((question, index) => {
//                 const correct = isAnswerCorrect(question.id);
//                 return (
//                   <Card
//                     key={question.id}
//                     className={cn(
//                       "p-6 rounded-2xl border-2",
//                       correct
//                         ? "border-green-300 bg-green-50"
//                         : "border-red-300 bg-red-50"
//                     )}
//                   >
//                     <div className="flex items-start mb-3">
//                       {correct ? (
//                         <CheckCircle2 className="h-6 w-6 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
//                       ) : (
//                         <XCircle className="h-6 w-6 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
//                       )}
//                       <div className="flex-1">
//                         <div className="flex items-center gap-2 mb-2">
//                           <span className="inline-block px-2 py-1 bg-white text-xs font-semibold rounded">
//                             {question.type}
//                           </span>
//                           <p className="font-semibold text-gray-900">
//                             Q{index + 1}. {question.question}
//                           </p>
//                         </div>
//                         <div className="space-y-2">
//                           <p className="text-sm">
//                             <span className="font-medium">Your answer:</span>{" "}
//                             <span
//                               className={correct ? "text-green-700" : "text-red-700"}
//                             >
//                               {answers[question.id] || "Not answered"}
//                             </span>
//                           </p>
//                           {!correct && (
//                             <p className="text-sm">
//                               <span className="font-medium">Correct answer:</span>{" "}
//                               <span className="text-green-700">
//                                 {question.correctAnswer}
//                               </span>
//                             </p>
//                           )}
//                           <p className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg">
//                             💡 {question.explanation}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </Card>
//                 );
//               })}
//             </div>
//           </div>
//         </ScrollArea>
//       </div>
//     );
//   }

//   const question = questions[currentQuestion];

//   return (
//     <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 to-blue-50">
//       <div className="p-4 border-b border-gray-200 bg-white">
//         <Button variant="ghost" onClick={onBack} className="mb-2">
//           <ArrowLeft className="h-4 w-4 mr-2" />
//           Back to Chat
//         </Button>
//         <div className="flex items-center justify-between">
//           <h2 className="text-xl font-bold text-gray-900">Quiz in Progress</h2>
//           <span className="text-sm text-gray-600">
//             Question {currentQuestion + 1} of {questions.length}
//           </span>
//         </div>
//       </div>

//       <ScrollArea className="flex-1">
//         <div className="max-w-3xl mx-auto p-8">
//           <Card className="p-8 bg-white shadow-xl rounded-2xl border-0">
//             <div className="mb-6">
//               <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full mb-4">
//                 {question.type}
//               </span>
//               <h3 className="text-xl font-semibold text-gray-900">
//                 {question.question}
//               </h3>
//             </div>

//             {question.type === "MCQ" && question.options ? (
//               <RadioGroup
//                 value={answers[question.id] || ""}
//                 onValueChange={(value) => handleAnswerChange(question.id, value)}
//               >
//                 <div className="space-y-3">
//                   {question.options.map((option, index) => (
//                     <div
//                       key={index}
//                       className={cn(
//                         "flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-purple-300 hover:bg-purple-50",
//                         answers[question.id] === option
//                           ? "border-purple-500 bg-purple-50"
//                           : "border-gray-200"
//                       )}
//                     >
//                       <RadioGroupItem value={option} id={`option-${index}`} />
//                       <Label
//                         htmlFor={`option-${index}`}
//                         className="flex-1 cursor-pointer"
//                       >
//                         {option}
//                       </Label>
//                     </div>
//                   ))}
//                 </div>
//               </RadioGroup>
//             ) : (
//               <Textarea
//                 value={answers[question.id] || ""}
//                 onChange={(e) => handleAnswerChange(question.id, e.target.value)}
//                 placeholder="Type your answer here..."
//                 className="min-h-[200px] rounded-xl border-gray-300 focus:border-purple-500"
//               />
//             )}
//           </Card>

//           <div className="flex gap-3 mt-6">
//             {currentQuestion > 0 && (
//               <Button
//                 onClick={() => setCurrentQuestion((prev) => prev - 1)}
//                 variant="outline"
//                 className="rounded-xl"
//               >
//                 Previous
//               </Button>
//             )}
//             {currentQuestion < questions.length - 1 ? (
//               <Button
//                 onClick={() => setCurrentQuestion((prev) => prev + 1)}
//                 className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
//               >
//                 Next Question
//               </Button>
//             ) : (
//               <Button
//                 onClick={handleSubmit}
//                 className="flex-1 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
//               >
//                 Submit Quiz
//               </Button>
//             )}
//           </div>
//         </div>
//       </ScrollArea>
//     </div>
//   );
// }
"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  TrendingUp,
  Award,
  Clock,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface QuizAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
}

interface QuizResult {
  id: string;
  timestamp: Date;
  score: number;
  total: number;
  answers: QuizAnswer[];
  questionTypes: {
    mcq: number;
    saq: number;
    laq: number;
  };
}

interface ProgressDashboardProps {
  onBack: () => void;
  quizHistory: QuizResult[];
}

export default function ProgressDashboard({ onBack, quizHistory }: ProgressDashboardProps) {
  // Calculate stats from quiz history
  const totalQuizzes = quizHistory.length;
  const averageScore = totalQuizzes > 0
    ? Math.round(
        quizHistory.reduce((sum, quiz) => sum + (quiz.score / quiz.total) * 100, 0) / totalQuizzes
      )
    : 0;

  // Get recent quiz history (last 7 quizzes)
  const recentQuizzes = quizHistory.slice(-7).map((quiz, index) => ({
    quiz: `Q${index + 1}`,
    score: Math.round((quiz.score / quiz.total) * 100),
  }));

  // Calculate performance by question type
  const questionTypePerformance = [
    {
      type: "MCQs",
      score: calculateTypeAverage("mcq"),
    },
    {
      type: "SAQs",
      score: calculateTypeAverage("saq"),
    },
    {
      type: "LAQs",
      score: calculateTypeAverage("laq"),
    },
  ].filter(item => item.score > 0);

  function calculateTypeAverage(type: "mcq" | "saq" | "laq"): number {
    const relevantQuizzes = quizHistory.filter(
      (quiz) => quiz.questionTypes[type] > 0
    );
    if (relevantQuizzes.length === 0) return 0;
    
    const avg = relevantQuizzes.reduce(
      (sum, quiz) => sum + (quiz.score / quiz.total) * 100,
      0
    ) / relevantQuizzes.length;
    
    return Math.round(avg);
  }

  // Calculate improvement (compare first half vs second half of quizzes)
  const improvement = totalQuizzes >= 2 ? (() => {
    const midPoint = Math.floor(totalQuizzes / 2);
    const firstHalf = quizHistory.slice(0, midPoint);
    const secondHalf = quizHistory.slice(midPoint);
    
    const firstAvg = firstHalf.reduce((sum, q) => sum + (q.score / q.total) * 100, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, q) => sum + (q.score / q.total) * 100, 0) / secondHalf.length;
    
    return Math.round(secondAvg - firstAvg);
  })() : 0;

  // Calculate total study time (mock - 30 minutes per quiz)
  const totalStudyTime = Math.round((totalQuizzes * 30) / 60);

  // Format recent activity
  const recentActivity = quizHistory.slice(-3).reverse().map((quiz) => {
    const percentage = Math.round((quiz.score / quiz.total) * 100);
    const timeAgo = getTimeAgo(quiz.timestamp);
    return {
      title: `Quiz (${quiz.questionTypes.mcq} MCQ, ${quiz.questionTypes.saq} SAQ, ${quiz.questionTypes.laq} LAQ)`,
      score: percentage,
      date: timeAgo,
      questions: quiz.total,
    };
  });

  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  // Empty state
  if (totalQuizzes === 0) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 to-blue-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <Button variant="ghost" onClick={onBack} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">Progress Dashboard</h2>
          <p className="text-sm text-gray-600">Track your learning journey</p>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-md w-full p-8 bg-white shadow-xl rounded-2xl border-0 text-center">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-200 to-blue-200 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Award className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Quiz History Yet</h3>
            <p className="text-gray-600 mb-6">
              Complete your first quiz to start tracking your progress and see detailed analytics here.
            </p>
            <Button onClick={onBack} className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 to-blue-50">
      <div className="p-4 border-b border-gray-200 bg-white">
        <Button variant="ghost" onClick={onBack} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chat
        </Button>
        <h2 className="text-2xl font-bold text-gray-900">Progress Dashboard</h2>
        <p className="text-sm text-gray-600">Track your learning journey for this chat</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl border-0 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-8 w-8" />
                <span className="text-3xl font-bold">{totalQuizzes}</span>
              </div>
              <p className="text-sm opacity-90">Quizzes Completed</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl border-0 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-8 w-8" />
                <span className="text-3xl font-bold">{averageScore}%</span>
              </div>
              <p className="text-sm opacity-90">Average Score</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl border-0 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-8 w-8" />
                <span className="text-3xl font-bold">{improvement >= 0 ? '+' : ''}{improvement}%</span>
              </div>
              <p className="text-sm opacity-90">Improvement</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl border-0 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-8 w-8" />
                <span className="text-3xl font-bold">{totalStudyTime}h</span>
              </div>
              <p className="text-sm opacity-90">Study Time</p>
            </Card>
          </div>

          {/* Charts */}
          {recentQuizzes.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quiz Performance Over Time */}
              <Card className="p-6 bg-white rounded-2xl shadow-lg border-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Quiz Performance
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={recentQuizzes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="quiz"
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: "#8b5cf6", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Question Type Performance */}
              {questionTypePerformance.length > 0 && (
                <Card className="p-6 bg-white rounded-2xl shadow-lg border-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Performance by Question Type
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={questionTypePerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="type"
                        stroke="#6b7280"
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: "12px" }}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="score" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>
          )}

          {/* Strengths & Weaknesses */}
          {questionTypePerformance.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white rounded-2xl shadow-lg border-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  💪 Strengths
                </h3>
                <div className="space-y-4">
                  {questionTypePerformance
                    .filter((t) => t.score >= 75)
                    .map((item) => (
                      <div key={item.type}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {item.type}
                          </span>
                          <span className="text-sm font-semibold text-green-600">
                            {item.score}%
                          </span>
                        </div>
                        <Progress value={item.score} className="h-2" />
                      </div>
                    ))}
                  {questionTypePerformance.filter((t) => t.score >= 75).length === 0 && (
                    <p className="text-sm text-gray-600 text-center py-4">
                      Keep practicing to build your strengths!
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-white rounded-2xl shadow-lg border-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📚 Areas to Improve
                </h3>
                <div className="space-y-4">
                  {questionTypePerformance
                    .filter((t) => t.score < 75)
                    .map((item) => (
                      <div key={item.type}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {item.type}
                          </span>
                          <span className="text-sm font-semibold text-orange-600">
                            {item.score}%
                          </span>
                        </div>
                        <Progress value={item.score} className="h-2" />
                      </div>
                    ))}
                  {questionTypePerformance.filter((t) => t.score < 75).length === 0 && (
                    <p className="text-sm text-gray-600 text-center py-4">
                      Great job! All areas are strong! 🎉
                    </p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <Card className="p-6 bg-white rounded-2xl shadow-lg border-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">
                        {activity.questions} questions • {activity.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">
                        {activity.score}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
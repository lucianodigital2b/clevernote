export type QuizOption = {
    id: string;
    text: string;
    is_correct: boolean;
};

export type QuizQuestion = {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'fill_in_blank';
  explanation?: string;
  options: QuizOption[];
};

export type QuizSet = {
    id: string;
    title: string;
    description?: string;
    questions: QuizQuestion[];
    createdAt: string;
    updatedAt: string;
};

export type QuizProgress = {
    currentQuestionIndex: number;
    score: number;
    totalQuestions: number;
    completedAt?: string;
};

export type QuizAnswer = {
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
    timeSpent?: number;
};

export type QuizResult = {
    quizId: string;
    score: number;
    totalQuestions: number;
    answers: QuizAnswer[];
    startedAt: string;
    completedAt: string;
};
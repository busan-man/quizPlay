import api from './axios';

export interface QuestionData {
  prompt: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[] | undefined;
  correctAnswer: string | string[];
  points?: number;
  category?: string;
  timeLimit?: number;
  // 문제 은행 시스템 필드들
  subject?: string;
  grade?: string;
  unit?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  isShared?: boolean;
  tags?: string[];
}

// Create a new question
export const createQuestion = async (data: QuestionData) => {
  const response = await api.post('/questions', data);
  return response.data;
};

// Get all questions for a teacher
export const getTeacherQuestions = async () => {
  const response = await api.get('/questions');
  return response.data;
};

// Get a question by ID
export const getQuestionById = async (questionId: string) => {
  const response = await api.get(`/questions/${questionId}`);
  return response.data;
};

// Update a question
export const updateQuestion = async (questionId: string, data: Partial<QuestionData>) => {
  const response = await api.put(`/questions/${questionId}`, data);
  return response.data;
};

// Delete a question
export const deleteQuestion = async (questionId: string) => {
  const response = await api.delete(`/questions/${questionId}`);
  return response.data;
};

// Get shared questions from other teachers
export const getSharedQuestions = async (filters?: {
  subject?: string;
  grade?: string;
  unit?: string;
  difficulty?: string;
  search?: string;
}) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  
  const response = await api.get(`/questions/shared/search?${params.toString()}`);
  return response.data;
};
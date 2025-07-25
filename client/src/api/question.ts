import api from './axios';

export interface QuestionData {
  prompt: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[] | undefined;
  correctAnswer: string | string[];
  points?: number;
  category?: string;
  timeLimit?: number;
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
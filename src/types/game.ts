export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string | number;
  points: number;
}

export interface GameState {
  nickname: string;
  currentScore: number;
  currentQuestion: number;
  gameMode: GameMode;
  questions: Question[];
  answeredQuestions: Set<string>;
  position: { x: number; y: number };
}

export type GameMode = 'sequential' | 'exploration' | 'gold-quest' | 'crypto-hack' | 'tower-defense';

export interface PlayerStats {
  nickname: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
}
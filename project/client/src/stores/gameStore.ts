import { create } from 'zustand';

export interface Player {
  id: string;
  name: string;
  score: number;
  isActive: boolean;
}

export interface Question {
  prompt: string;
  type: string;
  options?: string[];
  timeLimit?: number;
  points: number;
}

export interface GameState {
  gameId: string | null;
  playerId: string | null;
  playerName: string | null;
  isHost: boolean;
  gameStatus: 'lobby' | 'active' | 'finished';
  players: Player[];
  currentQuestion: Question | null;
  questionNumber: number;
  totalQuestions: number;
  lastAnswerResult: {
    correct: boolean;
    pointsEarned: number;
    correctAnswer?: string | string[];
  } | null;
  
  // Actions
  setGameInfo: (gameId: string, playerId?: string, playerName?: string, isHost?: boolean) => void;
  setGameStatus: (status: 'lobby' | 'active' | 'finished') => void;
  setPlayers: (players: Player[]) => void;
  setCurrentQuestion: (question: Question, number: number, total: number) => void;
  setAnswerResult: (result: { correct: boolean; pointsEarned: number; correctAnswer?: string | string[] }) => void;
  clearGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameId: null,
  playerId: null,
  playerName: null,
  isHost: false,
  gameStatus: 'lobby',
  players: [],
  currentQuestion: null,
  questionNumber: 0,
  totalQuestions: 0,
  lastAnswerResult: null,
  
  setGameInfo: (gameId, playerId, playerName, isHost = false) => set({ 
    gameId, 
    playerId, 
    playerName, 
    isHost 
  }),
  
  setGameStatus: (status) => set({ gameStatus: status }),
  
  setPlayers: (players) => set({ players }),
  
  setCurrentQuestion: (question, number, total) => set({ 
    currentQuestion: question, 
    questionNumber: number, 
    totalQuestions: total,
    lastAnswerResult: null
  }),
  
  setAnswerResult: (result) => set({ lastAnswerResult: result }),
  
  clearGame: () => set({
    gameId: null,
    playerId: null,
    playerName: null,
    isHost: false,
    gameStatus: 'lobby',
    players: [],
    currentQuestion: null,
    questionNumber: 0,
    totalQuestions: 0,
    lastAnswerResult: null
  })
}));
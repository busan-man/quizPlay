import { create } from 'zustand';
import { GameState, GameMode, Question } from '../types/game';

interface GameStore extends GameState {
  setNickname: (nickname: string) => void;
  setGameMode: (mode: GameMode) => void;
  setQuestions: (questions: Question[]) => void;
  updateScore: (points: number) => void;
  movePlayer: (x: number, y: number) => void;
  answerQuestion: (questionId: string, answer: string | number) => boolean;
  resetGame: () => void;
}

const initialState: GameState = {
  nickname: '',
  currentScore: 0,
  currentQuestion: 0,
  gameMode: 'sequential',
  questions: [],
  answeredQuestions: new Set(),
  position: { x: 0, y: 0 },
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setNickname: (nickname) => set({ nickname }),
  
  setGameMode: (gameMode) => set({ gameMode }),
  
  setQuestions: (questions) => set({ questions }),
  
  updateScore: (points) => 
    set((state) => ({ currentScore: state.currentScore + points })),
  
  movePlayer: (x, y) => 
    set({ position: { x, y } }),
  
  answerQuestion: (questionId, answer) => {
    let isCorrect = false;
    
    set((state) => {
      const question = state.questions.find(q => q.id === questionId);
      if (question && !state.answeredQuestions.has(questionId)) {
        isCorrect = answer === question.correctAnswer;
        const newScore = state.currentScore + (isCorrect ? question.points : 0);
        const newAnswered = new Set(state.answeredQuestions).add(questionId);
        
        return {
          currentScore: newScore,
          answeredQuestions: newAnswered,
          currentQuestion: state.currentQuestion + 1,
        };
      }
      return state;
    });
    
    return isCorrect;
  },
  
  resetGame: () => set(initialState),
}));
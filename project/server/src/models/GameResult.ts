import mongoose from 'mongoose';

interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedAnswer: string;
  isCorrect: boolean;
  points: number;
  timeSpent: number; // 답변에 걸린 시간 (초)
  submittedAt: Date;
}

export interface IGameResult {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  playerId: string;
  playerName: string;
  characterId?: string;
  finalScore: number;
  correctAnswers: number;
  totalQuestions: number;
  totalTime: number; // 전체 게임 시간 (초)
  answers: IAnswer[];
  rank: number;
  averageResponseTime: number; // 평균 답변 시간
  accuracyRate: number; // 정답률 (%)
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  selectedAnswer: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 0
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const gameResultSchema = new mongoose.Schema<IGameResult>({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  playerId: {
    type: String,
    required: true
  },
  playerName: {
    type: String,
    required: true
  },
  characterId: {
    type: String
  },
  finalScore: {
    type: Number,
    required: true,
    min: 0
  },
  correctAnswers: {
    type: Number,
    required: true,
    min: 0
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 0
  },
  totalTime: {
    type: Number,
    required: true,
    min: 0
  },
  answers: [answerSchema],
  rank: {
    type: Number,
    required: true,
    min: 1
  },
  averageResponseTime: {
    type: Number,
    required: true,
    min: 0
  },
  accuracyRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// 인덱스 설정 (쿼리 성능 최적화)
gameResultSchema.index({ gameId: 1 });
gameResultSchema.index({ playerId: 1 });
gameResultSchema.index({ finalScore: -1 });
gameResultSchema.index({ createdAt: -1 });

const GameResult = mongoose.model<IGameResult>('GameResult', gameResultSchema);

export default GameResult;


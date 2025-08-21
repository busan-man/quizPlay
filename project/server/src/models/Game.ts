import mongoose from 'mongoose';

export enum GameStatus {
  LOBBY = 'lobby',
  ACTIVE = 'active',
  FINISHED = 'finished'
}

export enum GameMode {
  QUIZ = 'quiz',
  CRYPTO_HACK = 'crypto_hack',
  RACE = 'race'
}

interface IPlayer {
  id: string;
  name: string;
  score: number;
  isActive: boolean;      // 게임 참여 상태 (실제 플레이 중인지)
  isConnected: boolean;   // 소켓 연결 상태 (온라인/오프라인)
  currentQuestion?: number;
  characterId?: string;
  joinedAt: Date;         // 참가 시간
  lastActiveAt: Date;     // 마지막 활동 시간
  correctAnswers: number;
}

export interface IGame {
  _id: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  gameCode: string;
  status: GameStatus;
  mode: GameMode;
  questions: mongoose.Types.ObjectId[];
  players: IPlayer[];
  currentQuestion: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

const gameSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  gameCode: {
    type: String,
    required: true,
    unique: true,
    default: () => Math.floor(100000 + Math.random() * 900000).toString()
  },
  status: {
    type: String,
    enum: Object.values(GameStatus),
    default: GameStatus.LOBBY
  },
  mode: {
    type: String,
    enum: Object.values(GameMode),
    default: GameMode.QUIZ
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  players: [{
    id: String,
    name: String,
    score: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isConnected: {
      type: Boolean,
      default: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    currentQuestion: Number,
    characterId: String,
    correctAnswers: {
      type: Number,
      default: 0
    }
  }],
  currentQuestion: {
    type: Number,
    default: 0
  },
  startedAt: Date,
  endedAt: Date
}, {
  timestamps: true
});

// Generate a unique game code before saving
gameSchema.pre('save', async function(this: any, next) {
  if (this.isNew) {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.gameCode = randomCode;
  }
  next();
});

const Game = mongoose.model<IGame>('Game', gameSchema);

export default Game;
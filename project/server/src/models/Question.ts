import mongoose from 'mongoose';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer'
}

export interface IQuestion {
  _id: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  prompt: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  category?: string;
  timeLimit?: number;
  // 문제 은행 시스템을 위한 새 필드들
  subject: string;        // 과목 (국어, 수학, 영어, 과학, 사회 등)
  grade: string;          // 학년 (1학년, 2학년, 3학년 등)
  unit: string;           // 단원 (1단원, 2단원 등)
  difficulty: 'easy' | 'medium' | 'hard';  // 난이도
  isShared: boolean;      // 공유 여부
  tags: string[];         // 태그 (검색용)
  usageCount: number;     // 사용 횟수
  averageScore: number;   // 평균 정답률
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new mongoose.Schema<IQuestion>({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: Object.values(QuestionType),
    default: QuestionType.MULTIPLE_CHOICE
  },
  options: {
    type: [String],
    validate: {
      validator: function(this: IQuestion, options: string[]) {
        return this.type !== QuestionType.MULTIPLE_CHOICE || (options && options.length >= 2);
      },
      message: 'Multiple choice questions must have at least 2 options'
    }
  },
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  points: {
    type: Number,
    default: 100,
    min: 0
  },
  category: {
    type: String
  },
  timeLimit: {
    type: Number,
    min: 5,
    max: 300
  },
  // 문제 은행 시스템을 위한 새 필드들
  subject: {
    type: String,
    required: true,
    enum: ['국어', '수학', '영어', '과학', '사회', '음악', '미술', '체육', '기타']
  },
  grade: {
    type: String,
    required: true,
    enum: ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년', '중1', '중2', '중3', '고1', '고2', '고3']
  },
  unit: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  isShared: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: []
  },
  usageCount: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

const Question = mongoose.model<IQuestion>('Question', questionSchema);

export default Question;
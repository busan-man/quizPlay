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
  }
}, {
  timestamps: true
});

const Question = mongoose.model<IQuestion>('Question', questionSchema);

export default Question;
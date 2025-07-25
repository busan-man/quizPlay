import { Question } from '../types/game';

export const questions: Question[] = [
  {
    id: '1',
    type: 'multiple-choice',
    text: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 2,
    points: 100
  },
  {
    id: '2',
    type: 'true-false',
    text: 'The Earth is flat.',
    options: ['True', 'False'],
    correctAnswer: 1,
    points: 50
  },
  {
    id: '3',
    type: 'multiple-choice',
    text: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 1,
    points: 100
  },
  {
    id: '4',
    type: 'short-answer',
    text: 'What is 2 + 2?',
    correctAnswer: '4',
    points: 150
  },
  {
    id: '5',
    type: 'multiple-choice',
    text: 'Who painted the Mona Lisa?',
    options: ['Van Gogh', 'Da Vinci', 'Picasso', 'Rembrandt'],
    correctAnswer: 1,
    points: 100
  }
];
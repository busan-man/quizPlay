import { Request, Response } from 'express';
import Question, { QuestionType } from '../models/Question';

// Create a new question
export const createQuestion = async (req: Request, res: Response) => {
  try {
    const { 
      prompt, type, options, correctAnswer, points, category, timeLimit,
      subject, grade, unit, difficulty, isShared, tags 
    } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Validate required fields
    if (!prompt || !type || !correctAnswer || !subject || !grade || !unit) {
      return res.status(400).json({ message: 'Prompt, type, correct answer, subject, grade, and unit are required' });
    }

    // Validate options for multiple choice
    if (type === QuestionType.MULTIPLE_CHOICE && (!options || options.length < 2)) {
      return res.status(400).json({ message: 'Multiple choice questions require at least 2 options' });
    }

    // Create new question
    const question = new Question({
      prompt,
      type,
      options,
      correctAnswer,
      points: points || 100,
      category,
      timeLimit,
      subject,
      grade,
      unit,
      difficulty: difficulty || 'medium',
      isShared: isShared || false,
      tags: tags || [],
      createdBy: req.user.id
    });

    await question.save();

    res.status(201).json(question);
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all questions for a teacher
export const getTeacherQuestions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const questions = await Question.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    console.error('Get teacher questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a question by ID
export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Verify teacher is the creator
    if (req.user?.id !== question.createdBy.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(question);
  } catch (error) {
    console.error('Get question by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a question
export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const { prompt, type, options, correctAnswer, points, category, timeLimit } = req.body;
    
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Verify teacher is the creator
    if (req.user?.id !== question.createdBy.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update fields
    if (prompt) question.prompt = prompt;
    if (type) question.type = type;
    if (options) question.options = options;
    if (correctAnswer) question.correctAnswer = correctAnswer;
    if (points) question.points = points;
    if (category) question.category = category;
    if (timeLimit) question.timeLimit = timeLimit;

    // Validate options for multiple choice
    if (question.type === QuestionType.MULTIPLE_CHOICE && (!question.options || question.options.length < 2)) {
      return res.status(400).json({ message: 'Multiple choice questions require at least 2 options' });
    }

    await question.save();

    res.json(question);
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a question
export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Verify teacher is the creator
    if (req.user?.id !== question.createdBy.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await question.deleteOne();

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get shared questions from other teachers
export const getSharedQuestions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { subject, grade, unit, difficulty, search } = req.query;
    
    // Build filter object
    const filter: any = {
      isShared: true,
      createdBy: { $ne: req.user.id } // Exclude own questions
    };

    if (subject) filter.subject = subject;
    if (grade) filter.grade = grade;
    if (unit) filter.unit = unit;
    if (difficulty) filter.difficulty = difficulty;
    
    // Text search in prompt and tags
    if (search) {
      filter.$or = [
        { prompt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    const questions = await Question.find(filter)
      .populate('createdBy', 'name email')
      .sort({ usageCount: -1, createdAt: -1 }) // Popular questions first
      .limit(100); // Limit to prevent overload

    res.json(questions);
  } catch (error) {
    console.error('Get shared questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
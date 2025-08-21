import express from 'express';
import { 
  createQuestion, getTeacherQuestions, 
  getQuestionById, updateQuestion, deleteQuestion,
  getSharedQuestions 
} from '../controllers/questionController';
import { authMiddleware, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = express.Router();

// Create a new question (teacher only)
router.post(
  '/', 
  authMiddleware, 
  authorizeRoles(UserRole.TEACHER), 
  createQuestion
);

// Get all questions for a teacher
router.get(
  '/', 
  authMiddleware, 
  authorizeRoles(UserRole.TEACHER), 
  getTeacherQuestions
);

// Get a question by ID
router.get(
  '/:id', 
  authMiddleware, 
  authorizeRoles(UserRole.TEACHER), 
  getQuestionById
);

// Update a question (teacher only)
router.put(
  '/:id', 
  authMiddleware, 
  authorizeRoles(UserRole.TEACHER), 
  updateQuestion
);

// Delete a question (teacher only)
router.delete(
  '/:id', 
  authMiddleware, 
  authorizeRoles(UserRole.TEACHER), 
  deleteQuestion
);

// Get shared questions from other teachers (teacher only)
router.get(
  '/shared/search', 
  authMiddleware, 
  authorizeRoles(UserRole.TEACHER), 
  getSharedQuestions
);

export default router;
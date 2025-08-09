import express from 'express';
import { 
  createGame, getTeacherGames, getGameById, 
  joinGame, startGame, endGame, getGameResults
} from '../controllers/gameController';
import { authMiddleware, authorizeRoles } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = express.Router();

// Create a new game (teacher only)
router.post(
  '/', 
  authMiddleware, 
  authorizeRoles(UserRole.TEACHER), 
  createGame
);

// Get all games for a teacher
router.get(
  '/teacher', 
  authMiddleware, 
  authorizeRoles(UserRole.TEACHER), 
  getTeacherGames
);

// Get a game by ID
router.get('/:id', authMiddleware, getGameById);

// Get game results (teacher only)
router.get(
  '/:id/results', 
  authMiddleware, 
  authorizeRoles(UserRole.TEACHER), 
  getGameResults
);

// Join a game as student
router.post('/join', joinGame);

// Start a game (teacher only)
router.put(
  '/:id/start', 
  authMiddleware, 
  authorizeRoles(UserRole.TEACHER), 
  startGame
);

// End a game (teacher only)
router.put(
  '/:id/end', 
  authMiddleware, 
  authorizeRoles(UserRole.TEACHER), 
  endGame
);

export default router;
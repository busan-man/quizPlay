import { Request, Response } from 'express';
import Game, { GameStatus, GameMode } from '../models/Game';
import Question from '../models/Question';

// Create a new game
export const createGame = async (req: Request, res: Response) => {
  try {
    const { title, questionIds, mode } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Validate questions
    if (!questionIds || questionIds.length === 0) {
      return res.status(400).json({ message: 'Questions are required' });
    }

    // Verify all questions exist
    const questions = await Question.find({ _id: { $in: questionIds } });
    if (questions.length !== questionIds.length) {
      return res.status(400).json({ message: 'Some questions do not exist' });
    }

    // Create new game
    const game = new Game({
      title,
      createdBy: req.user.id,
      questions: questionIds,
      mode: mode || GameMode.QUIZ
    });

    await game.save();

    res.status(201).json({
      gameId: game._id,
      gameCode: game.gameCode,
      title: game.title,
      status: game.status,
      mode: game.mode
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all games for a teacher
export const getTeacherGames = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const games = await Game.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .select('_id title gameCode status mode players createdAt');

    res.json(games);
  } catch (error) {
    console.error('Get teacher games error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a game by ID
export const getGameById = async (req: Request, res: Response) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('questions', 'prompt type options points');

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // If user is not the creator and game is not active, deny access
    if (req.user?.id !== game.createdBy.toString() && game.status === GameStatus.LOBBY) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(game);
  } catch (error) {
    console.error('Get game by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Join a game as student
export const joinGame = async (req: Request, res: Response) => {
  try {
    const { gameCode, playerName } = req.body;

    if (!gameCode || !playerName) {
      return res.status(400).json({ message: 'Game code and player name are required' });
    }

    const game = await Game.findOne({ gameCode });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    if (game.status === GameStatus.FINISHED) {
      return res.status(400).json({ message: 'Game has already ended' });
    }

    // Generate a unique player ID
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Check for duplicate name
    const isDuplicateName = game.players.some(player => player.name === playerName);
    if (isDuplicateName) {
      return res.status(400).json({ message: 'Player name already taken' });
    }

    // Add player to game
    game.players.push({
      id: playerId,
      name: playerName,
      score: 0,
      isActive: true
    });

    await game.save();

    res.status(200).json({
      gameId: game._id,
      playerId,
      playerName,
      gameStatus: game.status,
      gameMode: game.mode
    });
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Start a game
export const startGame = async (req: Request, res: Response) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Verify teacher is the creator
    if (req.user?.id !== game.createdBy.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (game.status !== GameStatus.LOBBY) {
      return res.status(400).json({ message: 'Game has already started or ended' });
    }

    game.status = GameStatus.ACTIVE;
    game.startedAt = new Date();
    await game.save();

    res.json({ message: 'Game started successfully', gameId: game._id });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// End a game
export const endGame = async (req: Request, res: Response) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Verify teacher is the creator
    if (req.user?.id !== game.createdBy.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (game.status !== GameStatus.ACTIVE) {
      return res.status(400).json({ message: 'Game is not active' });
    }

    game.status = GameStatus.FINISHED;
    game.endedAt = new Date();
    await game.save();

    res.json({ message: 'Game ended successfully', gameId: game._id });
  } catch (error) {
    console.error('End game error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
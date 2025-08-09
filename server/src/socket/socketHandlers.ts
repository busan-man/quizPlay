import { Server, Socket } from 'socket.io';
import Game, { GameStatus } from '../models/Game';
import jwt from 'jsonwebtoken';

interface SocketUser {
  id: string;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
  gameId?: string;
  playerId?: string;
  gameCode?: string;
  playerName?: string;
  characterId?: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Middleware to authenticate socket connections
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (token) {
      try {
        const decoded = jwt.verify(
          token, 
          process.env.JWT_SECRET || 'your_jwt_secret'
        ) as SocketUser;
        
        socket.user = decoded;
      } catch (error) {
        // Invalid token, but still allow connection for students without tokens
        console.log('Socket auth error:', error);
      }
    }
    
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log('New socket connection:', socket.id);

    // Join a game as student (Unity integration)
    socket.on('joinGame', async ({ gameCode, playerName, characterId }) => {
      try {
        const game = await Game.findOne({ gameCode });
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        if (game.status === GameStatus.FINISHED) {
          socket.emit('error', { message: 'Game has already ended' });
          return;
        }

        // Generate a unique player ID
        const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Check for duplicate name
        const isDuplicateName = game.players.some(player => player.name === playerName);
        if (isDuplicateName) {
          socket.emit('error', { message: 'Player name already taken' });
          return;
        }

        // Add player to game
        game.players.push({
          id: playerId,
          name: playerName,
          score: 0,
          isActive: true,
          characterId: characterId
        });

        await game.save();

        // Store game info in socket
        socket.gameId = game._id.toString();
        socket.gameCode = gameCode;
        socket.playerId = playerId;
        socket.playerName = playerName;
        socket.characterId = characterId;
        
        // Join the game room
        socket.join(`game:${game._id}`);
        
        // Notify everyone about new player
        io.to(`game:${game._id}`).emit('playerJoined', {
          id: playerId,
          name: playerName,
          score: 0,
          characterId: characterId,
          isActive: true
        });

        // Send current game state to the player
        socket.emit('gameJoined', {
          gameId: game._id,
          playerId: playerId,
          gameStatus: game.status,
          currentPlayers: game.players.filter(p => p.isActive)
        });
        
      } catch (error) {
        console.error('Join game error:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    // Host a game as teacher (Unity integration)
    socket.on('hostGame', async ({ gameId, gameCode }) => {
      try {
        if (!socket.user) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const game = await Game.findById(gameId);
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Verify user is the game creator
        if (socket.user.id !== game.createdBy.toString()) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Store game info in socket
        socket.gameId = gameId;
        socket.gameCode = gameCode;
        
        // Join the game room
        socket.join(`game:${gameId}`);
        
        // Send current game state to the host
        socket.emit('gameHosted', {
          gameId: game._id,
          gameCode: game.gameCode,
          gameStatus: game.status,
          currentPlayers: game.players.filter(p => p.isActive),
          questions: game.questions.length
        });
        
      } catch (error) {
        console.error('Host game error:', error);
        socket.emit('error', { message: 'Failed to host game' });
      }
    });

    // Start game (teacher only)
    socket.on('startGame', async ({ gameId }) => {
      try {
        if (!socket.user || !socket.gameId) {
          socket.emit('error', { message: 'Not authenticated or not in a game' });
          return;
        }
        
        const game = await Game.findById(gameId);
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Verify user is the game creator
        if (socket.user.id !== game.createdBy.toString()) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }
        
        if (game.status !== GameStatus.LOBBY) {
          socket.emit('error', { message: 'Game has already started or ended' });
          return;
        }

        game.status = GameStatus.ACTIVE;
        game.startedAt = new Date();
        game.currentQuestion = 0;
        await game.save();

        // Notify all players that game has started
        io.to(`game:${gameId}`).emit('gameStarted', {
          gameId: game._id,
          startedAt: game.startedAt,
          totalQuestions: game.questions.length
        });
        
      } catch (error) {
        console.error('Start game error:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    // End game (teacher only)
    socket.on('endGame', async ({ gameId }) => {
      try {
        if (!socket.user || !socket.gameId) {
          socket.emit('error', { message: 'Not authenticated or not in a game' });
          return;
        }
        
        const game = await Game.findById(gameId);
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Verify user is the game creator
        if (socket.user.id !== game.createdBy.toString()) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }
        
        if (game.status !== GameStatus.ACTIVE) {
          socket.emit('error', { message: 'Game is not active' });
          return;
        }

        game.status = GameStatus.FINISHED;
        game.endedAt = new Date();
        await game.save();

        // Calculate final results
        const results = game.players
          .filter(p => p.isActive)
          .sort((a, b) => b.score - a.score)
          .map((player, index) => ({
            playerId: player.id,
            playerName: player.name,
            finalScore: player.score,
            correctAnswers: 0, // This would need to be tracked separately
            totalQuestions: game.questions.length,
            rank: index + 1,
            characterId: player.characterId
          }));

        // Notify all players that game has ended
        io.to(`game:${gameId}`).emit('gameEnded', results);
        
      } catch (error) {
        console.error('End game error:', error);
        socket.emit('error', { message: 'Failed to end game' });
      }
    });

    // Submit answer from Unity
    socket.on('submitAnswer', async ({ gameCode, playerName, answer, questionId }) => {
      try {
        if (!socket.gameId || !socket.playerId) {
          socket.emit('error', { message: 'Not in a game' });
          return;
        }
        
        const game = await Game.findById(socket.gameId)
          .populate('questions');
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        if (game.status !== GameStatus.ACTIVE) {
          socket.emit('error', { message: 'Game is not active' });
          return;
        }
        
        // Get the current question
        const questionIndex = game.currentQuestion - 1;
        if (questionIndex < 0 || questionIndex >= game.questions.length) {
          socket.emit('error', { message: 'Invalid question' });
          return;
        }
        
        const question = game.questions[questionIndex];
        
        // Check if the answer is correct
        const isCorrect = Array.isArray((question as any).correctAnswer)
          ? (question as any).correctAnswer.includes(answer)
          : (question as any).correctAnswer === answer;
        
        let pointsEarned = 0;
        
        if (isCorrect) {
          pointsEarned = (question as any).points || 100;
          
          // Find player and update score
          const playerIndex = game.players.findIndex(p => p.id === socket.playerId);
          
          if (playerIndex !== -1) {
            game.players[playerIndex].score += pointsEarned;
            await game.save();
          }
        }
        
        // Send result to the player
        socket.emit('answerResult', {
          correct: isCorrect,
          pointsEarned,
          correctAnswer: (question as any).correctAnswer,
          playerName: socket.playerName
        });
        
        // Notify all players about the answer
        io.to(`game:${socket.gameId}`).emit('answerResult', {
          playerId: socket.playerId,
          playerName: socket.playerName,
          correct: isCorrect,
          pointsEarned,
          answer: answer
        });
        
        // Send updated scores to everyone
        io.to(`game:${socket.gameId}`).emit('scoreUpdate', {
          playerId: socket.playerId,
          newScore: game.players.find(p => p.id === socket.playerId)?.score || 0,
          players: game.players
            .filter(p => p.isActive)
            .sort((a, b) => b.score - a.score)
            .map(p => ({
              id: p.id,
              name: p.name,
              score: p.score,
              characterId: p.characterId
            }))
        });
        
      } catch (error) {
        console.error('Submit answer error:', error);
        socket.emit('error', { message: 'Failed to submit answer' });
      }
    });

    // Game complete from Unity
    socket.on('gameComplete', async ({ gameCode, playerName, finalScore, correctAnswers, totalQuestions }) => {
      try {
        if (!socket.gameId || !socket.playerId) {
          socket.emit('error', { message: 'Not in a game' });
          return;
        }
        
        const game = await Game.findById(socket.gameId);
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Update player's final score and stats
        const playerIndex = game.players.findIndex(p => p.id === socket.playerId);
        
        if (playerIndex !== -1) {
          game.players[playerIndex].score = finalScore;
          // You might want to store additional stats like correctAnswers, totalQuestions
          await game.save();
        }
        
        // Notify all players about the completion
        io.to(`game:${socket.gameId}`).emit('playerGameComplete', {
          playerId: socket.playerId,
          playerName: playerName,
          finalScore: finalScore,
          correctAnswers: correctAnswers,
          totalQuestions: totalQuestions
        });
        
      } catch (error) {
        console.error('Game complete error:', error);
        socket.emit('error', { message: 'Failed to complete game' });
      }
    });

    // Send next question (teacher only)
    socket.on('nextQuestion', async () => {
      try {
        if (!socket.user || !socket.gameId) {
          socket.emit('error', { message: 'Not authenticated or not in a game' });
          return;
        }
        
        const game = await Game.findById(socket.gameId)
          .populate('questions', 'prompt type options points timeLimit');
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }
        
        // Verify user is the game creator
        if (socket.user.id !== game.createdBy.toString()) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }
        
        if (game.status !== GameStatus.ACTIVE) {
          socket.emit('error', { message: 'Game is not active' });
          return;
        }
        
        // Check if we have more questions
        if (game.currentQuestion >= game.questions.length) {
          socket.emit('error', { message: 'No more questions' });
          return;
        }
        
        // Get the current question
        const question = game.questions[game.currentQuestion] as any;
        const questionForPlayers = {
          id: question._id,
          prompt: question.prompt,
          type: question.type,
          options: question.options,
          points: question.points,
          timeLimit: question.timeLimit
        };
        
        // Send question to all players in the game
        io.to(`game:${socket.gameId}`).emit('questionUpdate', questionForPlayers);
        
        // Increment the current question counter
        game.currentQuestion += 1;
        await game.save();
        
      } catch (error) {
        console.error('Next question error:', error);
        socket.emit('error', { message: 'Failed to send next question' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Socket disconnected:', socket.id);
      
      if (socket.gameId && socket.playerId) {
        try {
          const game = await Game.findById(socket.gameId);
          
          if (game) {
            // Mark player as inactive
            const playerIndex = game.players.findIndex(p => p.id === socket.playerId);
            
            if (playerIndex !== -1) {
              game.players[playerIndex].isActive = false;
              await game.save();
              
              io.to(`game:${socket.gameId}`).emit('playerLeft', socket.playerId);
            }
          }
        } catch (error) {
          console.error('Disconnect handler error:', error);
        }
      }
    });
  });
};
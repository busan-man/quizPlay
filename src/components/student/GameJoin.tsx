import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader } from 'lucide-react';
import { Button } from '../ui/Button';
import { useGameStore } from '../../store/gameStore';

const GameJoin: React.FC = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  
  const { setNickname: setGameNickname } = useGameStore();
  
  const handleJoin = () => {
    if (!roomCode) {
      setError('Please enter a room code');
      return;
    }
    
    if (!nickname) {
      setError('Please enter your nickname');
      return;
    }
    
    setError('');
    setIsJoining(true);
    
    // Set the nickname in the game store
    setGameNickname(nickname);
    
    setTimeout(() => {
      setIsJoining(false);
      navigate('/game/start');
    }, 1500);
  };
  
  return (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <LogIn className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Join a Game</h2>
        <p className="text-gray-600 mt-2">Enter the room code provided by your teacher to join.</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-1">
            Room Code
          </label>
          <input
            type="text"
            id="roomCode"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
            placeholder="Enter code (e.g., ABC123)"
            maxLength={6}
          />
        </div>
        
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
            Your Nickname
          </label>
          <input
            type="text"
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your nickname"
            maxLength={20}
          />
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        <Button 
          onClick={handleJoin}
          className="w-full" 
          disabled={isJoining}
        >
          {isJoining ? (
            <>
              <Loader className="animate-spin h-5 w-5 mr-2" />
              Joining...
            </>
          ) : (
            'Join Game'
          )}
        </Button>
        
        <div className="text-center text-sm text-gray-500">
          <p>
            Need help? Ask your teacher for the room code.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GameJoin;
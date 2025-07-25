import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket, disconnectSocket } from '../socket/socket';
import { Gamepad } from 'lucide-react';

const GameLayout = () => {
  const { gameId, clearGame } = useGameStore();
  const navigate = useNavigate();
  const [unityLoaded, setUnityLoaded] = useState(false);

  useEffect(() => {
    // If no gameId, navigate back
    if (!gameId) {
      navigate('/');
      return;
    }

    // Simulate Unity loading 
    // In a real app, you'd check when the Unity WebGL build is loaded
    const timer = setTimeout(() => {
      setUnityLoaded(true);
    }, 1500);

    // Initialize socket connection
    const token = localStorage.getItem('token');
    getSocket(token);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      disconnectSocket();
      clearGame();
    };
  }, [gameId, navigate, clearGame]);

  if (!gameId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900">
      {!unityLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gray-900">
          <Gamepad className="text-indigo-500 h-16 w-16 mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Game...</h2>
          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
          </div>
        </div>
      )}         

      {/* This is where Unity WebGL would be embedded in production */}
      <div className={`relative w-full h-full ${unityLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
        <div className="absolute top-0 left-0 right-0 h-12 bg-gray-800 flex items-center justify-between px-4 z-10">
          <div className="text-white font-semibold">Game ID: {gameId}</div>
          <button 
            onClick={() => {
              disconnectSocket();
              clearGame();
              navigate('/');
            }}
            className="text-white hover:text-red-400"
          >
            Exit Game
          </button>
        </div>

        {/* Unity WebGL container - in a real app, this would be an iframe or Unity Web component */}
        <div className="absolute inset-0 mt-12">
          <Outlet />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { width: 0; }
          50% { width: 100%; }
          100% { width: 0; }
        }
      `}</style>
    </div>
  );
};

export default GameLayout;
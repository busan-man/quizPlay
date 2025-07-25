import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Brain, Mountain, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

const GameModes: React.FC = () => {
  const navigate = useNavigate();
  
  const games = [
    {
      id: 1,
      title: 'Quiz Challenge',
      description: 'Fast-paced quiz game where students answer questions to earn points and climb the leaderboard.',
      icon: <Brain className="h-12 w-12 text-indigo-600" />,
      color: 'bg-indigo-50 border-indigo-200',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      id: 2,
      title: 'Quest Adventure',
      description: 'RPG-style educational adventure where students solve problems to progress through an exciting story.',
      icon: <Mountain className="h-12 w-12 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200',
      buttonColor: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: 3,
      title: 'Skill Builder',
      description: 'Practice mode where students can build skills at their own pace with adaptive difficulty levels.',
      icon: <Gamepad2 className="h-12 w-12 text-emerald-600" />,
      color: 'bg-emerald-50 border-emerald-200',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700'
    },
    {
      id: 4,
      title: 'Team Battle',
      description: 'Collaborative game where students work in teams to solve challenges and compete against other teams.',
      icon: <Sparkles className="h-12 w-12 text-amber-600" />,
      color: 'bg-amber-50 border-amber-200',
      buttonColor: 'bg-amber-600 hover:bg-amber-700'
    }
  ];

  const handleExplore = (gameId: number) => {
    navigate('/game/start');
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Exciting Game Modes</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Multiple ways to engage students with educational content that's both fun and effective.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {games.map((game) => (
            <Card key={game.id} className={`border-2 ${game.color} transform transition-transform hover:scale-105`}>
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-6">
                  {game.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{game.title}</h3>
                <p className="text-gray-600 mb-6">{game.description}</p>
                <button 
                  className={`${game.buttonColor} text-white px-4 py-2 rounded-md font-medium transition-colors w-full`}
                  onClick={() => handleExplore(game.id)}
                >
                  Explore
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameModes;
import React from 'react';
import { BookOpen, Users, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Make Learning <span className="text-emerald-300">Fun</span> and <span className="text-amber-300">Engaging</span>
            </h1>
            <p className="text-lg sm:text-xl opacity-90 leading-relaxed">
              EduQuest transforms classroom learning with interactive games that students love. Create custom quizzes, RPG adventures, and more to boost engagement.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate('/teacher')}>
                Get Started
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/student')} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Try Demo
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              <div className="flex items-center">
                <BookOpen className="h-6 w-6 mr-2 text-emerald-300" />
                <span>10,000+ Questions</span>
              </div>
              <div className="flex items-center">
                <Users className="h-6 w-6 mr-2 text-amber-300" />
                <span>500,000+ Students</span>
              </div>
              <div className="flex items-center">
                <Award className="h-6 w-6 mr-2 text-pink-300" />
                <span>Award-winning</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg transform rotate-6 opacity-50"></div>
            <div className="relative bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="bg-indigo-100 p-4 flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <div className="ml-4 text-indigo-900 font-medium">EduQuest Game Room</div>
              </div>
              <div className="p-6 bg-gradient-to-br from-indigo-50 to-white">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-indigo-900 mb-2">Math Adventures</h3>
                  <p className="text-indigo-700">Room Code: <span className="font-mono font-bold">XYZ123</span></p>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100 flex items-center justify-between">
                    <span className="font-medium text-gray-800">Emma S.</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm">850 pts</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100 flex items-center justify-between">
                    <span className="font-medium text-gray-800">James T.</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm">720 pts</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100 flex items-center justify-between">
                    <span className="font-medium text-gray-800">Sofia M.</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm">695 pts</span>
                  </div>
                </div>
                <div className="text-center">
                  <button
                    onClick={() => navigate('/student')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Join New Game
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
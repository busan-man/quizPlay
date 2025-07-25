import React from 'react';
import { Users, Clock, Trophy, BookOpen, Activity, Shield, Globe, Zap } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      id: 1,
      title: 'Simple Room Creation',
      description: 'Create game rooms in seconds with just a few clicks and share the code with your students.',
      icon: <Users className="h-6 w-6 text-indigo-600" />
    },
    {
      id: 2,
      title: 'Real-time Engagement',
      description: 'See student participation and progress in real-time as they solve problems and complete challenges.',
      icon: <Clock className="h-6 w-6 text-indigo-600" />
    },
    {
      id: 3,
      title: 'Performance Tracking',
      description: 'Track individual and class performance with detailed analytics and exportable reports.',
      icon: <Activity className="h-6 w-6 text-indigo-600" />
    },
    {
      id: 4,
      title: 'Custom Content',
      description: 'Create your own questions or use our extensive library of pre-made educational content.',
      icon: <BookOpen className="h-6 w-6 text-indigo-600" />
    },
    {
      id: 5,
      title: 'Leaderboards',
      description: 'Motivate students with competitive leaderboards that update in real-time during gameplay.',
      icon: <Trophy className="h-6 w-6 text-indigo-600" />
    },
    {
      id: 6,
      title: 'Safe Environment',
      description: 'Secure platform with teacher controls and moderation to ensure a safe learning experience.',
      icon: <Shield className="h-6 w-6 text-indigo-600" />
    },
    {
      id: 7,
      title: 'Works Everywhere',
      description: 'Access on any device with a browser - no downloads or installations required.',
      icon: <Globe className="h-6 w-6 text-indigo-600" />
    },
    {
      id: 8,
      title: 'Fast Setup',
      description: 'Get started in minutes with intuitive controls and helpful onboarding guidance.',
      icon: <Zap className="h-6 w-6 text-indigo-600" />
    }
  ];
  
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features for Educators</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Everything you need to create engaging learning experiences that students love.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.id} className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-4 mx-auto">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{feature.title}</h3>
              <p className="text-gray-600 text-center">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
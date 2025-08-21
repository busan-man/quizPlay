import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

const CTASection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to transform your classroom?</h2>
        <p className="text-lg sm:text-xl opacity-90 max-w-3xl mx-auto mb-8">
          Join thousands of teachers who are making learning fun and effective with EduQuest's interactive educational games.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            variant="success" 
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-600 group"
            onClick={() => navigate('/teacher')}
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="border-white border-opacity-30 text-white hover:bg-white/10"
            onClick={() => navigate('/about')}
          >
            Schedule a Demo
          </Button>
        </div>
        
        <p className="mt-6 text-sm opacity-80">No credit card required. Free for teachers with up to 30 students.</p>
      </div>
    </section>
  );
};

export default CTASection;
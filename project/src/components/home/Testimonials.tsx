import React from 'react';
import { Star } from 'lucide-react';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      quote: "EduQuest transformed my classroom. My students are excited about math for the first time!",
      author: "Sarah Johnson",
      role: "5th Grade Teacher",
      rating: 5,
      image: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      id: 2,
      quote: "The RPG games make science concepts stick with my students better than any textbook ever could.",
      author: "Michael Rodriguez",
      role: "High School Science Teacher",
      rating: 5,
      image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      id: 3,
      quote: "My students ask if they can play EduQuest games, not realizing they're actually learning!",
      author: "Jennifer Lee",
      role: "Middle School English Teacher",
      rating: 5,
      image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150"
    }
  ];
  
  return (
    <section className="py-16 bg-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Teachers Are Saying</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Join thousands of educators who have transformed their classroom with EduQuest.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-lg shadow-md p-6 relative">
              {/* Quote mark */}
              <div className="absolute top-4 right-6 text-6xl text-indigo-100 font-serif leading-none">"</div>
              
              <div className="flex items-center mb-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.author} 
                  className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-indigo-200"
                />
                <div>
                  <h4 className="font-bold text-gray-900">{testimonial.author}</h4>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                ))}
              </div>
              
              <p className="text-gray-700 italic relative z-10">{testimonial.quote}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
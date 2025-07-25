import { BookOpen, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center md:flex-row md:justify-between">
          <div className="flex items-center">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            <span className="ml-2 text-lg font-semibold text-gray-900">
              QuizPlay
            </span>
          </div>
          
          <div className="mt-4 md:mt-0">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} QuizPlay. All rights reserved.
            </p>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="flex justify-center space-x-6">
            <a
              href="#"
              className="text-gray-400 hover:text-gray-500"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Built with React, Node.js, MongoDB, and Socket.IO
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, BookOpen, LogIn, Menu, X } from 'lucide-react';
import { Link } from '../ui/Link';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-md w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => handleNavigation('/')}>
            <Gamepad2 className="h-8 w-8 mr-2" />
            <span className="text-xl font-bold">EduQuest</span>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <button onClick={() => handleNavigation('/')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition-colors">
              Home
            </button>
            <button onClick={() => handleNavigation('/about')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition-colors">
              About
            </button>
            <button onClick={() => handleNavigation('/games')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition-colors">
              Games
            </button>
            <button onClick={() => handleNavigation('/teacher')} className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-indigo-800 hover:bg-indigo-700 transition-colors">
              <BookOpen className="h-4 w-4 mr-2" />
              Teacher Dashboard
            </button>
            <button onClick={() => handleNavigation('/student')} className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-white text-indigo-600 hover:bg-gray-100 transition-colors">
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-indigo-500 focus:outline-none transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-indigo-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button onClick={() => handleNavigation('/')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 transition-colors">
              Home
            </button>
            <button onClick={() => handleNavigation('/about')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 transition-colors">
              About
            </button>
            <button onClick={() => handleNavigation('/games')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 transition-colors">
              Games
            </button>
            <button onClick={() => handleNavigation('/teacher')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 transition-colors">
              Teacher Dashboard
            </button>
            <button onClick={() => handleNavigation('/student')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500 transition-colors">
              Login
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
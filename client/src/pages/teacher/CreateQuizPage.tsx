import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, Save, ChevronRight, ChevronLeft, Loader } from 'lucide-react';
import { getTeacherQuestions } from '../../api/question';
import { createGame } from '../../api/game';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Question {
  _id: string;
  prompt: string;
  type: string;
  points: number;
  category?: string;
}

interface CreateQuizForm {
  title: string;
  mode: 'quiz' | 'crypto_hack' | 'race';
}

const CreateQuizPage = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateQuizForm>({
    defaultValues: {
      title: '',
      mode: 'quiz'
    }
  });
  
  useEffect(() => {
    loadQuestions();
  }, []);
  
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsData = await getTeacherQuestions();
      setQuestions(questionsData);
    } catch (error) {
      toast.error('Failed to load questions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleQuestion = (questionId: string) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    } else {
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  };
  
  const onSubmit = async (data: CreateQuizForm) => {
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }
    
    try {
      setCreating(true);
      const gameData = await createGame({
        title: data.title,
        questionIds: selectedQuestions,
        mode: data.mode
      });
      
      toast.success('Quiz created successfully!');
      
      // 성공 시
      navigate('/teacher');
    } catch (error) {
      toast.error('Failed to create quiz');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };
  
  const handleNextTab = () => {
    if (activeTab < 1) setActiveTab(activeTab + 1);
  };
  
  const handlePreviousTab = () => {
    if (activeTab > 0) setActiveTab(activeTab - 1);
  };
  
  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'true_false':
        return 'True/False';
      case 'short_answer':
        return 'Short Answer';
      default:
        return type;
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Create New Quiz</h1>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-6">
            <nav className="flex" aria-label="Progress">
              <ol className="space-y-3 md:flex md:space-y-0 md:space-x-8">
                <li className="md:flex-1">
                  <button
                    onClick={() => setActiveTab(0)}
                    className={`group flex items-center w-full ${
                      activeTab === 0 ? 'text-indigo-600' : 'text-gray-500'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                      activeTab === 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      1
                    </span>
                    <span className="ml-3 text-sm font-medium">Select Questions</span>
                  </button>
                </li>
                
                <li className="md:flex-1">
                  <button
                    onClick={() => setActiveTab(1)}
                    className={`group flex items-center w-full ${
                      activeTab === 1 ? 'text-indigo-600' : 'text-gray-500'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                      activeTab === 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      2
                    </span>
                    <span className="ml-3 text-sm font-medium">Quiz Details</span>
                  </button>
                </li>
              </ol>
            </nav>
          </div>
          
          <div className="mt-6">
            {/* Select Questions Tab */}
            {activeTab === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Select Questions ({selectedQuestions.length} selected)
                  </h2>
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleNextTab}
                      disabled={selectedQuestions.length === 0}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Next 
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                  </div>
                ) : questions.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {questions.map(question => (
                      <div
                        key={question._id}
                        className={`border rounded-lg p-4 cursor-pointer transition ${
                          selectedQuestions.includes(question._id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleQuestion(question._id)}
                      >
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.includes(question._id)}
                            onChange={() => toggleQuestion(question._id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                          />
                          <div className="ml-3">
                            <p className="text-gray-900 font-medium">{question.prompt}</p>
                            <div className="mt-1 flex items-center space-x-4">
                              <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-full">
                                {getQuestionTypeLabel(question.type)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {question.points} points
                              </span>
                              {question.category && (
                                <span className="text-xs text-gray-500">
                                  Category: {question.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No questions available. Create one first!</p>
                    <button
                      onClick={() => navigate('/teacher/questions')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Question
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Quiz Details Tab */}
            {activeTab === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Quiz Details</h2>
                  
                  <button
                    type="button"
                    onClick={handlePreviousTab}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </button>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Quiz Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      {...register('title', { required: 'Title is required' })}
                      className={`mt-1 block w-full rounded-md border ${
                        errors.title ? 'border-red-500' : 'border-gray-300'
                      } shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="mode" className="block text-sm font-medium text-gray-700">
                      Game Mode
                    </label>
                    <select
                      id="mode"
                      {...register('mode')}
                      className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      <option value="quiz">Standard Quiz</option>
                      <option value="crypto_hack">Crypto Hack</option>
                      <option value="race">Race Mode</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Selected Questions
                    </label>
                    <div className="mt-1 bg-gray-50 p-3 rounded-md border border-gray-200">
                      <p className="text-gray-700">{selectedQuestions.length} questions selected</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={creating}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
                    >
                      {creating ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create Quiz
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuizPage;
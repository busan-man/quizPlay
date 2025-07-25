import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash, AlertCircle } from 'lucide-react';
import { 
  getTeacherQuestions, 
  deleteQuestion, 
  createQuestion, 
  updateQuestion,
  QuestionData
} from '../../api/question';
import QuestionForm from '../../components/forms/QuestionForm';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  _id: string;
  prompt: string;
  type: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  category?: string;
  timeLimit?: number;
  createdAt: string;
}

const ManageQuestionsPage = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  
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
  
  const handleCreateQuestion = async (data: QuestionData) => {
    try {
      setIsSubmitting(true);
      await createQuestion(data);
      toast.success('Question created successfully');
      setIsModalOpen(false);
      loadQuestions();
    } catch (error) {
      toast.error('Failed to create question');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateQuestion = async (data: QuestionData) => {
    if (!editingQuestion) return;
    
    try {
      setIsSubmitting(true);
      await updateQuestion(editingQuestion._id, data);
      toast.success('Question updated successfully');
      setIsModalOpen(false);
      setEditingQuestion(null);
      loadQuestions();
    } catch (error) {
      toast.error('Failed to update question');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openCreateModal = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };
  
  const openEditModal = (question: Question) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };
  
  const confirmDelete = (questionId: string) => {
    setDeletingQuestionId(questionId);
    setConfirmDeleteOpen(true);
  };
  
  const handleDeleteQuestion = async () => {
    if (!deletingQuestionId) return;
    
    try {
      await deleteQuestion(deletingQuestionId);
      toast.success('Question deleted successfully');
      setQuestions(questions.filter(q => q._id !== deletingQuestionId));
    } catch (error) {
      toast.error('Failed to delete question');
      console.error(error);
    } finally {
      setDeletingQuestionId(null);
      setConfirmDeleteOpen(false);
    }
  };
  
  const filteredQuestions = questions.filter(question => 
    question.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (question.category && question.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manage Questions</h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Question
        </button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredQuestions.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredQuestions.map(question => (
              <motion.li 
                key={question._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                layout
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 break-words">
                        {question.prompt}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {getQuestionTypeLabel(question.type)}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {question.points} points
                        </span>
                        {question.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {question.category}
                          </span>
                        )}
                        {question.timeLimit && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {question.timeLimit}s
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-5 flex-shrink-0 flex space-x-2">
                      <button
                        onClick={() => openEditModal(question)}
                        className="p-1 rounded-full text-indigo-600 hover:bg-indigo-100 focus:outline-none"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(question._id)}
                        className="p-1 rounded-full text-red-600 hover:bg-red-100 focus:outline-none"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          {searchQuery ? (
            <p className="text-gray-500">No questions found matching your search.</p>
          ) : (
            <>
              <p className="text-gray-500 mb-4">You haven't created any questions yet.</p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Question
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Create/Edit Question Modal */}
<AnimatePresence>
  {isModalOpen && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-[9990]"
        aria-hidden="true"
      />

      {/* Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white z-[9999] rounded-lg shadow-xl w-full max-w-lg p-6 relative"
      >
        <div className="bg-white">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            {editingQuestion ? 'Edit Question' : 'Create New Question'}
          </h3>
          <QuestionForm
            initialData={
              editingQuestion
                ? {
                    ...editingQuestion,
                    type: editingQuestion.type as
                      | 'multiple_choice'
                      | 'true_false'
                      | 'short_answer',
                  }
                : undefined
            }
            onSubmit={
              editingQuestion ? handleUpdateQuestion : handleCreateQuestion
            }
            isSubmitting={isSubmitting}
          />
        </div>
        <div className="bg-gray-50 mt-6 px-4 py-3 sm:px-6 flex justify-end">
          <button
            type="button"
            onClick={closeModal}
            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

{/* Confirm Delete Modal */}
<AnimatePresence>
  {confirmDeleteOpen && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-[9990]"
        aria-hidden="true"
      />

      {/* Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white z-[9999] rounded-lg shadow-xl w-full max-w-lg p-6 relative"
      >
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Delete Question
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this question? This action
                cannot be undone.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 mt-6 px-4 py-3 sm:px-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleDeleteQuestion}
            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(false)}
            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

    </div>
  );
};

export default ManageQuestionsPage;
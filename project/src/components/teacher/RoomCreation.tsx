import React, { useState } from 'react';
import { PlusCircle, BookOpen, Trash2, Settings, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/Card';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

const RoomCreation: React.FC = () => {
  const [roomName, setRoomName] = useState('');
  const [gameType, setGameType] = useState('quiz');
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      text: 'What is 9 × 7?',
      options: ['56', '63', '72', '81'],
      correctAnswer: 1
    },
    {
      id: '2',
      text: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 1
    }
  ]);
  
  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    };
    
    setQuestions([...questions, newQuestion]);
  };
  
  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };
  
  const updateQuestion = (id: string, field: string, value: string | number) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        return { ...q, [field]: value };
      }
      return q;
    }));
  };
  
  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };
  
  const createRoom = () => {
    // In a real app, this would call an API to create the room
    console.log('Creating room:', { roomName, gameType, questions });
    alert(`Room "${roomName}" created! Room code: ABC123`);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Game Room</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
              Room Name
            </label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Math Challenge"
            />
          </div>
          
          <div>
            <label htmlFor="gameType" className="block text-sm font-medium text-gray-700 mb-1">
              Game Type
            </label>
            <select
              id="gameType"
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="quiz">Quiz Challenge</option>
              <option value="quest">Quest Adventure</option>
              <option value="skill">Skill Builder</option>
              <option value="team">Team Battle</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Questions</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              onClick={() => console.log('Import questions')}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex items-center"
              onClick={addQuestion}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Question
            </Button>
          </div>
        </div>
        
        {questions.map((question, index) => (
          <Card key={question.id} className="mb-6 border border-gray-200">
            <CardHeader className="flex justify-between items-center bg-gray-50">
              <h4 className="font-medium">Question {index + 1}</h4>
              <div className="flex gap-2">
                <button 
                  onClick={() => removeQuestion(question.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => console.log('Question settings')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Text
                </label>
                <input
                  type="text"
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your question"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer Options
                </label>
                <div className="space-y-3">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center">
                      <input
                        type="radio"
                        id={`q${question.id}_opt${optionIndex}`}
                        name={`question_${question.id}`}
                        checked={question.correctAnswer === optionIndex}
                        onChange={() => updateQuestion(question.id, 'correctAnswer', optionIndex)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 mr-2"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Select the radio button next to the correct answer.
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {questions.length === 0 && (
          <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">No questions added yet. Click "Add Question" to get started.</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => console.log('Saving as draft')}>
          Save as Draft
        </Button>
        <Button onClick={createRoom}>
          Create Room
        </Button>
      </div>
    </div>
  );
};

export default RoomCreation;
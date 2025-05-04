import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import RoomCreation from '../components/teacher/RoomCreation';
import { Gamepad2, Users, History, Settings, PlusCircle, Copy } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';

const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  
  // Mock active rooms
  const activeRooms = [
    { id: '1', name: 'Math Challenge', gameType: 'quiz', code: 'ABC123', players: 12, dateCreated: new Date() },
    { id: '2', name: 'Science Quest', gameType: 'quest', code: 'XYZ789', players: 8, dateCreated: new Date() }
  ];
  
  // Mock past games
  const pastGames = [
    { id: '3', name: 'Geography Quiz', gameType: 'quiz', players: 24, date: new Date(Date.now() - 86400000) },
    { id: '4', name: 'Language Arts', gameType: 'skill', players: 18, date: new Date(Date.now() - 172800000) },
    { id: '5', name: 'History Facts', gameType: 'team', players: 20, date: new Date(Date.now() - 345600000) }
  ];
  
  const renderDashboard = () => (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h2>
        <button
          onClick={() => setIsCreatingRoom(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Create New Room
        </button>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Game Rooms</h3>
        
        {activeRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeRooms.map(room => (
              <Card key={room.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">{room.name}</h4>
                      <p className="text-sm text-gray-500">
                        {room.gameType === 'quiz' && 'Quiz Challenge'}
                        {room.gameType === 'quest' && 'Quest Adventure'}
                        {room.gameType === 'skill' && 'Skill Builder'}
                        {room.gameType === 'team' && 'Team Battle'}
                      </p>
                    </div>
                    <div className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-medium">
                      Active
                    </div>
                  </div>
                  
                  <div className="flex justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Room Code</div>
                      <div className="flex items-center">
                        <span className="font-mono font-bold text-gray-900">{room.code}</span>
                        <button 
                          onClick={() => console.log(`Copy code: ${room.code}`)}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Players</div>
                      <div className="flex items-center text-gray-900 font-medium">
                        <Users className="h-4 w-4 mr-1 text-indigo-600" />
                        {room.players}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                      Edit
                    </button>
                    <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                      View Room
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg">
            <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">You don't have any active game rooms.</p>
            <button
              onClick={() => setIsCreatingRoom(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Create Your First Room
            </button>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Past Games</h3>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Game Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Game Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Players
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pastGames.map(game => (
                <tr key={game.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {game.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {game.gameType === 'quiz' && 'Quiz Challenge'}
                    {game.gameType === 'quest' && 'Quest Adventure'}
                    {game.gameType === 'skill' && 'Skill Builder'}
                    {game.gameType === 'team' && 'Team Battle'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {game.players} students
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {game.date.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      View Results
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-900">
                      Replay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-6 pb-16">
        {!isCreatingRoom ? (
          <div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    className={`${
                      activeTab === 'dashboard'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('dashboard')}
                  >
                    Dashboard
                  </button>
                  <button
                    className={`${
                      activeTab === 'analytics'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('analytics')}
                  >
                    Analytics
                  </button>
                  <button
                    className={`${
                      activeTab === 'library'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('library')}
                  >
                    Content Library
                  </button>
                  <button
                    className={`${
                      activeTab === 'settings'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('settings')}
                  >
                    Settings
                  </button>
                </nav>
              </div>
            </div>
            
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'analytics' && (
              <div className="max-w-5xl mx-auto p-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h2>
                <p className="text-gray-600">Student performance analytics will appear here.</p>
              </div>
            )}
            {activeTab === 'library' && (
              <div className="max-w-5xl mx-auto p-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Library</h2>
                <p className="text-gray-600">Your saved questions and game content will appear here.</p>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="max-w-5xl mx-auto p-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
                <p className="text-gray-600">Account and application settings will appear here.</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <button
                onClick={() => setIsCreatingRoom(false)}
                className="text-indigo-600 font-medium hover:text-indigo-800"
              >
                ← Back to Dashboard
              </button>
            </div>
            <RoomCreation />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default TeacherDashboard;
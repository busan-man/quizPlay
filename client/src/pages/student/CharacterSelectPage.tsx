import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface Character {
  id: string;
  name: string;
  image: string;
  description: string;
}

const characters: Character[] = [
  {
    id: 'warrior',
    name: '전사',
    image: '/characters/warrior.png',
    description: '강력한 공격력을 가진 전사입니다.'
  },
  {
    id: 'mage',
    name: '마법사',
    image: '/characters/mage.png',
    description: '지혜로운 마법을 사용하는 마법사입니다.'
  },
  {
    id: 'archer',
    name: '궁수',
    image: '/characters/archer.png',
    description: '정확한 화살을 쏘는 궁수입니다.'
  },
  {
    id: 'healer',
    name: '치유사',
    image: '/characters/healer.png',
    description: '친구들을 치료하는 치유사입니다.'
  }
];

const CharacterSelectPage: React.FC = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { gameCode, playerName } = location.state || {};

  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacter(characterId);
  };

  const handleStartGame = () => {
    if (!selectedCharacter) {
      alert('캐릭터를 선택해주세요!');
      return;
    }

    // Unity 게임만 표시하는 페이지로 이동
    navigate(`/unity?role=student&code=${gameCode}&nickname=${playerName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">캐릭터 선택</h1>
          <p className="text-gray-600">게임에서 사용할 캐릭터를 선택해주세요!</p>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              게임 코드: <span className="font-mono font-bold">{gameCode}</span>
            </p>
            <p className="text-sm text-blue-800">
              플레이어: <span className="font-bold">{playerName}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {characters.map((character) => (
            <Card
              key={character.id}
              className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                selectedCharacter === character.id
                  ? 'ring-4 ring-blue-500 bg-blue-50'
                  : 'hover:shadow-lg'
              }`}
              onClick={() => handleCharacterSelect(character.id)}
            >
              <div className="text-center p-4">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎮</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {character.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {character.description}
                </p>
                {selectedCharacter === character.id && (
                  <div className="text-blue-600 font-semibold">✓ 선택됨</div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={handleStartGame}
            disabled={!selectedCharacter}
            className="px-8 py-3 text-lg font-semibold"
          >
            게임 시작하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelectPage; 
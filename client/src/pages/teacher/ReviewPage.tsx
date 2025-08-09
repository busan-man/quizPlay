import { useParams } from 'react-router-dom';

const ReviewPage = () => {
  const { gameCode } = useParams();

  // TODO: 서버에서 gameCode로 결과/리뷰 데이터 fetch

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">게임 리뷰</h1>
        <p className="mb-2 text-gray-700">Game Code: <span className="font-mono text-indigo-600">{gameCode}</span></p>
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">리뷰/결과 데이터</h2>
          <div className="bg-gray-50 border rounded p-4 text-gray-600">
            {/* 여기에 서버에서 받아온 결과/리뷰 데이터 표시 */}
            <p>리뷰 데이터가 여기에 표시됩니다.</p>
          </div>
        </div>
        <button onClick={() => window.history.back()} className="mt-8 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">뒤로가기</button>
      </div>
    </div>
  );
};

export default ReviewPage; 
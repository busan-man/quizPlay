import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { PlusCircle, X, Save, Loader } from 'lucide-react';
import { QuestionData } from '../../api/question';

interface QuestionFormProps {
  initialData?: Partial<QuestionData>;
  onSubmit: (data: QuestionData) => Promise<void>;
  isSubmitting?: boolean;
}

const QuestionForm = ({ initialData, onSubmit, isSubmitting = false }: QuestionFormProps) => {
  const [questionType, setQuestionType] = useState<string>(initialData?.type || 'multiple_choice');
  
  const { 
    register, 
    handleSubmit, 
    control, 
    formState: { errors } 
  } = useForm<QuestionData>({
    defaultValues: {
      prompt: initialData?.prompt || '',
      type: initialData?.type || 'multiple_choice',
      options: initialData?.options || ['', ''],
      correctAnswer: initialData?.correctAnswer || '',
      points: initialData?.points || 100,
      category: initialData?.category || '',
      timeLimit: initialData?.timeLimit || 30,
      // 문제 은행 필드들
      subject: initialData?.subject || '',
      grade: initialData?.grade || '',
      unit: initialData?.unit || '',
      difficulty: initialData?.difficulty || 'medium',
      isShared: initialData?.isShared || false,
      tags: initialData?.tags || []
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options' as never
  });

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuestionType(e.target.value);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
            문제 내용 *
          </label>
          <textarea
            id="prompt"
            {...register('prompt', { required: '문제 내용을 입력해주세요' })}
            rows={2}
            placeholder="문제를 입력하세요..."
            className={`mt-1 block w-full rounded-md border ${
              errors.prompt ? 'border-red-500' : 'border-gray-300'
            } shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
          />
          {errors.prompt && (
            <p className="mt-1 text-sm text-red-500">{errors.prompt.message}</p>
          )}
        </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            문제 유형 *
          </label>
          <select
            id="type"
            {...register('type', { required: true })}
            onChange={handleTypeChange}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="multiple_choice">객관식</option>
            <option value="true_false">참/거짓</option>
            <option value="short_answer">주관식</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="points" className="block text-sm font-medium text-gray-700">
            점수 *
          </label>
          <input
            id="points"
            type="number"
            min="0"
            {...register('points', { 
              required: '점수를 입력해주세요',
              valueAsNumber: true,
              min: { value: 0, message: '점수는 0 이상이어야 합니다' }
            })}
            className={`mt-1 block w-full rounded-md border ${
              errors.points ? 'border-red-500' : 'border-gray-300'
            } shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
          />
          {errors.points && (
            <p className="mt-1 text-sm text-red-500">{errors.points.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700">
            제한시간 (초) *
          </label>
          <input
            id="timeLimit"
            type="number"
            min="5"
            max="300"
            {...register('timeLimit', { 
              required: '제한시간을 입력해주세요',
              valueAsNumber: true,
              min: { value: 5, message: '최소 5초 이상이어야 합니다' },
              max: { value: 300, message: '최대 300초까지 가능합니다' }
            })}
            className={`mt-1 block w-full rounded-md border ${
              errors.timeLimit ? 'border-red-500' : 'border-gray-300'
            } shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
          />
          {errors.timeLimit && (
            <p className="mt-1 text-sm text-red-500">{errors.timeLimit.message}</p>
          )}
        </div>
      </div>

      {/* 문제 은행 분류 필드들 */}
      <div className="border-t pt-4">
        <h3 className="text-md font-medium text-gray-900 mb-3">문제 분류</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              과목 *
            </label>
            <select
              id="subject"
              {...register('subject', { required: '과목을 선택해주세요' })}
              className={`mt-1 block w-full rounded-md border ${
                errors.subject ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
            >
              <option value="">과목 선택</option>
              <option value="국어">국어</option>
              <option value="수학">수학</option>
              <option value="영어">영어</option>
              <option value="과학">과학</option>
              <option value="사회">사회</option>
              <option value="음악">음악</option>
              <option value="미술">미술</option>
              <option value="체육">체육</option>
              <option value="기타">기타</option>
            </select>
            {errors.subject && (
              <p className="mt-1 text-sm text-red-500">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
              학년 *
            </label>
            <select
              id="grade"
              {...register('grade', { required: '학년을 선택해주세요' })}
              className={`mt-1 block w-full rounded-md border ${
                errors.grade ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
            >
              <option value="">학년 선택</option>
              <option value="1학년">1학년</option>
              <option value="2학년">2학년</option>
              <option value="3학년">3학년</option>
              <option value="4학년">4학년</option>
              <option value="5학년">5학년</option>
              <option value="6학년">6학년</option>
              <option value="중1">중1</option>
              <option value="중2">중2</option>
              <option value="중3">중3</option>
              <option value="고1">고1</option>
              <option value="고2">고2</option>
              <option value="고3">고3</option>
            </select>
            {errors.grade && (
              <p className="mt-1 text-sm text-red-500">{errors.grade.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
              단원 *
            </label>
            <select
              id="unit"
              {...register('unit', { required: '단원을 선택해주세요' })}
              className={`mt-1 block w-full rounded-md border ${
                errors.unit ? 'border-red-500' : 'border-gray-300'
              } shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
            >
              <option value="">단원 선택</option>
              <option value="1단원">1단원</option>
              <option value="2단원">2단원</option>
              <option value="3단원">3단원</option>
              <option value="4단원">4단원</option>
              <option value="5단원">5단원</option>
              <option value="6단원">6단원</option>
              <option value="7단원">7단원</option>
              <option value="8단원">8단원</option>
              <option value="9단원">9단원</option>
              <option value="10단원">10단원</option>
              <option value="1-1단원">1-1단원</option>
              <option value="1-2단원">1-2단원</option>
              <option value="2-1단원">2-1단원</option>
              <option value="2-2단원">2-2단원</option>
              <option value="3-1단원">3-1단원</option>
              <option value="3-2단원">3-2단원</option>
              <option value="기타">기타</option>
            </select>
            {errors.unit && (
              <p className="mt-1 text-sm text-red-500">{errors.unit.message}</p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
              난이도
            </label>
            <select
              id="difficulty"
              {...register('difficulty')}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="easy">쉬움</option>
              <option value="medium">보통</option>
              <option value="hard">어려움</option>
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              카테고리 (선택)
            </label>
            <input
              id="category"
              type="text"
              {...register('category')}
              placeholder="예: 중간고사, 기말고사"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          <div className="flex items-end">
            <div className="flex items-center">
              <input
                id="isShared"
                type="checkbox"
                {...register('isShared')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isShared" className="ml-2 block text-sm text-gray-700">
                문제 공유
              </label>
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          체크하면 다른 선생님들이 이 문제를 퀴즈에 활용할 수 있습니다.
        </p>
      </div>

      
      {questionType === 'multiple_choice' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            답변 선택지 *
          </label>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2">
                <input
                  type="text"
                  {...register(`options.${index}` as const, { 
                    required: 'Option is required' 
                  })}
                  placeholder={`선택지 ${index + 1}`}
                  className={`block w-full rounded-md border ${
                    errors.options?.[index] ? 'border-red-500' : 'border-gray-300'
                  } shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
                />
                {index > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => append('')}
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <PlusCircle className="h-4 w-4 mr-1" /> 선택지 추가
            </button>
          </div>
        </div>
      )}
      
      {questionType === 'true_false' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            정답 *
          </label>
          <div className="mt-2 space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                {...register('correctAnswer', { required: '정답을 선택해주세요' })}
                value="true"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-2">참</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                {...register('correctAnswer', { required: '정답을 선택해주세요' })}
                value="false"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-2">거짓</span>
            </label>
          </div>
          {errors.correctAnswer && (
            <p className="mt-1 text-sm text-red-500">{errors.correctAnswer.message}</p>
          )}
        </div>
      )}
      
      {questionType === 'multiple_choice' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            정답 *
          </label>
          <select
            {...register('correctAnswer', { required: '정답을 선택해주세요' })}
            className={`mt-1 block w-full rounded-md border ${
              errors.correctAnswer ? 'border-red-500' : 'border-gray-300'
            } shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
          >
            <option value="" disabled>정답 선택</option>
            {fields.map((field, index) => (
              <option key={field.id} value={index}>
                선택지 {index + 1}
              </option>
            ))}
          </select>
          {errors.correctAnswer && (
            <p className="mt-1 text-sm text-red-500">{errors.correctAnswer.message}</p>
          )}
        </div>
      )}
      
      {questionType === 'short_answer' && (
        <div>
          <label htmlFor="correctAnswer" className="block text-sm font-medium text-gray-700">
            정답 *
          </label>
          <input
            id="correctAnswer"
            type="text"
            {...register('correctAnswer', { required: '정답을 입력해주세요' })}
            placeholder="정답을 입력하세요..."
            className={`mt-1 block w-full rounded-md border ${
              errors.correctAnswer ? 'border-red-500' : 'border-gray-300'
            } shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
          />
          {errors.correctAnswer && (
            <p className="mt-1 text-sm text-red-500">{errors.correctAnswer.message}</p>
          )}
        </div>
      )}
      
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {isSubmitting ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              문제 저장
            </>
          )}
        </button>
      </div>
    </form>
    </div>
  );
};

export default QuestionForm;
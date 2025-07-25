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
      timeLimit: initialData?.timeLimit || 30
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
          Question Prompt
        </label>
        <textarea
          id="prompt"
          {...register('prompt', { required: 'Question prompt is required' })}
          rows={3}
          className={`mt-1 block w-full rounded-md border ${
            errors.prompt ? 'border-red-500' : 'border-gray-300'
          } shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
        />
        {errors.prompt && (
          <p className="mt-1 text-sm text-red-500">{errors.prompt.message}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Question Type
          </label>
          <select
            id="type"
            {...register('type', { required: true })}
            onChange={handleTypeChange}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True/False</option>
            <option value="short_answer">Short Answer</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category (Optional)
          </label>
          <input
            id="category"
            type="text"
            {...register('category')}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="points" className="block text-sm font-medium text-gray-700">
            Points
          </label>
          <input
            id="points"
            type="number"
            min="0"
            {...register('points', { 
              required: 'Points are required',
              valueAsNumber: true,
              min: { value: 0, message: 'Points must be positive' }
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
            Time Limit (seconds)
          </label>
          <input
            id="timeLimit"
            type="number"
            min="5"
            max="300"
            {...register('timeLimit', { 
              required: 'Time limit is required',
              valueAsNumber: true,
              min: { value: 5, message: 'Time limit must be at least 5 seconds' },
              max: { value: 300, message: 'Time limit cannot exceed 300 seconds' }
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
      
      {questionType === 'multiple_choice' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Answer Options
          </label>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2">
                <input
                  type="text"
                  {...register(`options.${index}` as const, { 
                    required: 'Option is required' 
                  })}
                  placeholder={`Option ${index + 1}`}
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
              <PlusCircle className="h-4 w-4 mr-1" /> Add Option
            </button>
          </div>
        </div>
      )}
      
      {questionType === 'true_false' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Correct Answer
          </label>
          <div className="mt-2 space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                {...register('correctAnswer', { required: 'Select the correct answer' })}
                value="true"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-2">True</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                {...register('correctAnswer', { required: 'Select the correct answer' })}
                value="false"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="ml-2">False</span>
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
            Correct Answer
          </label>
          <select
            {...register('correctAnswer', { required: 'Select the correct answer' })}
            className={`mt-1 block w-full rounded-md border ${
              errors.correctAnswer ? 'border-red-500' : 'border-gray-300'
            } shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
          >
            <option value="" disabled>Select correct option</option>
            {fields.map((field, index) => (
              <option key={field.id} value={index}>
                Option {index + 1}
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
            Correct Answer
          </label>
          <input
            id="correctAnswer"
            type="text"
            {...register('correctAnswer', { required: 'Correct answer is required' })}
            className={`mt-1 block w-full rounded-md border ${
              errors.correctAnswer ? 'border-red-500' : 'border-gray-300'
            } shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`}
          />
          {errors.correctAnswer && (
            <p className="mt-1 text-sm text-red-500">{errors.correctAnswer.message}</p>
          )}
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {isSubmitting ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Question
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default QuestionForm;
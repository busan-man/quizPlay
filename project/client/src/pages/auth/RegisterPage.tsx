import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ArrowLeft, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'teacher' | 'student';
};

const RegisterPage = () => {
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      role: 'student'
    }
  });
  
  const password = watch('password');
  
  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    
    try {
      await registerUser(data.name, data.email, data.password, data.role);
      toast.success('회원가입이 완료되었습니다');
      
      // Redirect based on role
      if (data.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (error: any) {
      toast.error(error.message || '회원가입에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        회원가입
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            이름
          </label>
          <input
            id="name"
            type="text"
            placeholder="이름을 입력하세요"
            {...register('name', { required: '이름을 입력해주세요' })}
            className={`mt-1 block w-full border ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            이메일
          </label>
          <input
            id="email"
            type="email"
            placeholder="이메일을 입력하세요"
            {...register('email', { 
              required: '이메일을 입력해주세요',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: '올바른 이메일 형식이 아닙니다',
              }
            })}
            className={`mt-1 block w-full border ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            placeholder="비밀번호를 입력하세요 (최소 6자)"
            {...register('password', { 
              required: '비밀번호를 입력해주세요',
              minLength: {
                value: 6,
                message: '비밀번호는 최소 6자 이상이어야 합니다',
              }
            })}
            className={`mt-1 block w-full border ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            비밀번호 확인
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            {...register('confirmPassword', { 
              required: '비밀번호를 다시 입력해주세요',
              validate: value => value === password || '비밀번호가 일치하지 않습니다'
            })}
            className={`mt-1 block w-full border ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            계정 유형
          </label>
          <div className="mt-2 flex space-x-4">
            <div className="flex items-center">
              <input
                id="role-student"
                type="radio"
                value="student"
                {...register('role')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <label htmlFor="role-student" className="ml-2 block text-sm text-gray-700">
                학생
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="role-teacher"
                type="radio"
                value="teacher"
                {...register('role')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <label htmlFor="role-teacher" className="ml-2 block text-sm text-gray-700">
                선생님
              </label>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {isSubmitting ? (
            <Loader className="h-5 w-5 animate-spin" />
          ) : (
            '회원가입'
          )}
        </button>
      </form>
      
      <div className="mt-6">
        <p className="text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}'
          <Link
            to="/auth/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
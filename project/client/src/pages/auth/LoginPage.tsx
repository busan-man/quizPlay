import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ArrowRight, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

type LoginFormData = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const from = location.state?.from?.pathname || '/';
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();
  
  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    
    try {
      await login(data.email, data.password);
      toast.success('로그인되었습니다');
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.message || '로그인에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        로그인
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            placeholder="비밀번호를 입력하세요"
            {...register('password', { required: '비밀번호를 입력해주세요' })}
            className={`mt-1 block w-full border ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {isSubmitting ? (
            <Loader className="h-5 w-5 animate-spin" />
          ) : (
            '로그인'
          )}
        </button>
      </form>
      
      <div className="mt-6">
        <p className="text-center text-sm text-gray-600">
          계정이 없으신가요?{' '}
          <Link
            to="/auth/register"
            className="font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center"
          >
            회원가입
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
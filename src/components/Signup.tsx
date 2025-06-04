import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('school'); // По умолчанию - школьник
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Animation
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Пароли не совпадают');
    }

    setIsLoading(true);

    try {
      await signup(email, password, displayName, role);
      navigate('/');
    } catch (err) {
      setError('Failed to create an account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-pulse"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05] pointer-events-none"></div>
      <div className="absolute top-20 left-[10%] w-64 h-64 bg-primary/10 rounded-full filter blur-3xl animate-pulse opacity-70 dark:opacity-20"></div>
      <div className="absolute bottom-20 right-[5%] w-96 h-96 bg-accent/10 rounded-full filter blur-3xl animate-pulse opacity-70 dark:opacity-20"></div>
      
      <div className={`sm:mx-auto sm:w-full sm:max-w-md relative z-10 transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="flex justify-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
              J
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              JumysAL
            </span>
          </Link>
      </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Создать аккаунт
              </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary/90 underline decoration-primary/30 hover:decoration-primary transition-all">
             Войти
          </Link>
              </p>
            </div>

      <div className={`mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 transition-all duration-700 delay-100 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="relative bg-white dark:bg-dark-lighter py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 backdrop-blur-sm border border-gray-100 dark:border-dark-border">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 sm:rounded-xl"></div>
          
          <form className="relative space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 animate-fadeInUp">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div className="group">
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Полное имя
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  autoComplete="name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="block w-full appearance-none pl-10 rounded-lg border border-gray-300 dark:border-dark-border px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-dark-lighter text-gray-900 dark:text-white transition-all duration-200"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Электронная почта
                </label>
              <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none pl-10 rounded-lg border border-gray-300 dark:border-dark-border px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-dark-lighter text-gray-900 dark:text-white transition-all duration-200"
                    placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Выбор роли */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Я являюсь:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`relative rounded-lg border ${
                    role === 'school' 
                      ? 'border-primary bg-primary/10 dark:bg-primary/5' 
                      : 'border-gray-300 dark:border-dark-border bg-white dark:bg-dark-lighter'
                  } px-4 py-3 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-dark-border flex items-center`}
                  onClick={() => setRole('school')}
                >
                  <input
                    type="radio"
                    name="role"
                    id="role-school"
                    value="school"
                    checked={role === 'school'}
                    onChange={() => setRole('school')}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <label htmlFor="role-school" className="ml-3 block text-sm font-medium cursor-pointer">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Ученик
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Ищу работу или стажировку
                    </p>
                  </label>
                </div>
                
                <div 
                  className={`relative rounded-lg border ${
                    role === 'business' 
                      ? 'border-primary bg-primary/10 dark:bg-primary/5' 
                      : 'border-gray-300 dark:border-dark-border bg-white dark:bg-dark-lighter'
                  } px-4 py-3 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-dark-border flex items-center`}
                  onClick={() => setRole('business')}
                >
                  <input
                    type="radio"
                    name="role"
                    id="role-business"
                    value="business"
                    checked={role === 'business'}
                    onChange={() => setRole('business')}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <label htmlFor="role-business" className="ml-3 block text-sm font-medium cursor-pointer">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Работодатель
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Вакансии, стажировки, проекты
                    </p>
                  </label>
                </div>
                </div>
              </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Пароль
                </label>
              <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none pl-10 rounded-lg border border-gray-300 dark:border-dark-border px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-dark-lighter text-gray-900 dark:text-white transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

            <div className="group">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Подтвердите пароль
                </label>
              <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                  id="confirmPassword"
                  name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full appearance-none pl-10 rounded-lg border border-gray-300 dark:border-dark-border px-3 py-2 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white dark:bg-dark-lighter text-gray-900 dark:text-white transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 rounded border-gray-300 dark:border-dark-border text-primary focus:ring-primary"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Я согласен с{' '}
                <Link to="/terms" className="font-medium text-primary hover:text-primary/80 transition-colors">
                  Пользовательским соглашением
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-medium text-primary hover:text-primary/80 transition-colors">
                  Политикой конфиденциальности
                </Link>
              </label>
            </div>

              <div>
                <button
                  type="submit"
                disabled={isLoading}
                className="relative w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group overflow-hidden"
              >
                <span className="relative z-10">{isLoading ? 'Creating account...' : 'Create account'}</span>
                <div className="absolute inset-0 h-full w-full scale-0 rounded-lg bg-white/20 transition-all duration-300 group-hover:scale-100"></div>
                </button>
              </div>
            </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-dark-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-dark-lighter px-2 text-gray-500 dark:text-gray-400">
                   Или войти с помощью
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-dark-border shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-lighter hover:bg-gray-50 dark:hover:bg-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
              >
                <svg className="h-5 w-5 text-[#1DA1F2]" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 5.9c-.7.3-1.5.5-2.4.6.9-.5 1.5-1.3 1.8-2.2-.8.5-1.7.8-2.6 1-.8-.8-1.8-1.3-3-1.3-2.3 0-4.1 1.9-4.1 4.1 0 .3 0 .6.1.9-3.4-.2-6.4-1.8-8.4-4.3-.4.6-.6 1.3-.6 2 0 1.4.7 2.7 1.8 3.4-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.7 3.3 4-.3.1-.7.1-1.1.1-.3 0-.5 0-.8-.1.5 1.6 2.1 2.8 3.9 2.8-1.4 1.1-3.2 1.8-5.1 1.8-.3 0-.7 0-1-.1 1.8 1.2 4 1.9 6.3 1.9 7.6 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.2"/>
                </svg>
                <span className="ml-2">Twitter</span>
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-dark-border shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-lighter hover:bg-gray-50 dark:hover:bg-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
              >
                <svg className="h-5 w-5 text-[#4285F4]" aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="currentColor"/>
                </svg>
                <span className="ml-2">Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 
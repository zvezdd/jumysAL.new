// components/Navbar.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoSvg from '../screenshots/logo.svg'; // Импортируем SVG-логотип
import ChatNotifications from './ChatNotifications';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      // Check localStorage or system preference
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return savedTheme === 'dark' || (!savedTheme && prefersDark);
    }
    return false;
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current && 
        avatarRef.current && 
        !userMenuRef.current.contains(event.target as Node) &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    
    // Close menu on route change
    const handleRouteChange = () => {
      setUserMenuOpen(false);
    };

    // Handle escape key
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Close user menu on location change
  useEffect(() => {
    setUserMenuOpen(false);
  }, [location]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const isActive = (path: string) => {
    return location.pathname === path
      ? 'text-primary dark:text-primary font-medium border-b-2 border-primary pb-1'
      : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors';
  };

  const handleLogout = async () => {
    try {
      console.log('Attempting to logout...');
      if (logout) {
        await logout();
        console.log('Logout successful, redirecting to login page...');
        // Close mobile menu if it's open
        setMenuOpen(false);
        setUserMenuOpen(false);
        // Use navigate to redirect to login page
        navigate('/login', { replace: true });
      } else {
        console.error('Logout function is not available');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const NavLinks = () => (
    <>
      <Link
        to="/"
        className={`text-sm font-medium transition-colors ${isActive('/')}`}
        onClick={() => setMenuOpen(false)}
      >
        Главная
      </Link>
      <Link
        to="/jobs"
        className={`text-sm font-medium transition-colors ${isActive('/jobs')}`}
        onClick={() => setMenuOpen(false)}
      >
        Вакансии
      </Link>
      <Link
        to="/resume-generator"
        className={`text-sm font-medium transition-colors ${isActive('/resume-generator')}`}
        onClick={() => setMenuOpen(false)}
      >
        Генератор резюме
      </Link>
      <Link
        to="/ai-mentor"
        className={`text-sm font-medium transition-colors ${isActive('/ai-mentor')}`}
        onClick={() => setMenuOpen(false)}
      >
        AI Ментор
      </Link>
      {/* <Link
        to="/about"
        className={`text-sm font-medium transition-colors ${isActive('/about')}`}
        onClick={() => setMenuOpen(false)}
      >
        О нас
      </Link> */}
      {/* <Link
        to="/contact"
        className={`text-sm font-medium transition-colors ${isActive('/contact')}`}
        onClick={() => setMenuOpen(false)}
      >
        Контакты
      </Link> */}
    </>
  );

  // User actions
  const UserActions = () => user ? (
    <div className="flex items-center gap-4">
      {/* Theme toggle */}
      <button
        onClick={toggleDarkMode}
        className="p-2 w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark transition-colors flex items-center justify-center"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      {/* Chat notifications */}
      <div className="w-10 h-10 flex items-center justify-center">
        <ChatNotifications />
      </div>

      {/* User avatar with dropdown */}
      <div className="relative">
        <button
          ref={avatarRef}
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
          aria-haspopup="true"
          aria-expanded={userMenuOpen}
        >
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="User avatar" 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </button>

        {/* User dropdown menu */}
        {userMenuOpen && (
          <div 
            ref={userMenuRef}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-lighter rounded-lg shadow-lg py-1 border border-gray-200 dark:border-dark-border z-50"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu"
          >
            <Link
              to="/profile"
              className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-lighter/80"
              role="menuitem"
              onClick={() => setUserMenuOpen(false)}
            >
              <svg className="w-5 h-5 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Профиль
            </Link>
            <Link
              to="/chats"
              className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-lighter/80"
              role="menuitem"
              onClick={() => setUserMenuOpen(false)}
            >
              <svg className="w-5 h-5 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Сообщения
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-lighter/80"
              role="menuitem"
            >
              <svg className="w-5 h-5 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Выход
            </button>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-4">
      {/* Theme toggle */}
      <button
        onClick={toggleDarkMode}
        className="p-2 w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark transition-colors flex items-center justify-center"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      <Link
        to="/login"
        className="text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
        onClick={() => setMenuOpen(false)}
      >
        Войти
      </Link>
      <Link
        to="/signup"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md hover:shadow-lg transition-all duration-200"
        onClick={() => setMenuOpen(false)}
      >
        Регистрация
      </Link>
    </div>
  );

  // Mobile menu items for user
  const mobilUserMenu = user ? (
    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-dark-border space-y-4">
      <Link
        to="/profile"
        className="flex items-center text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
        onClick={() => setMenuOpen(false)}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        Профиль
      </Link>
      <Link
        to="/chats"
        className="flex items-center text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
        onClick={() => setMenuOpen(false)}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        Сообщения
      </Link>
      <button
        onClick={() => {
          handleLogout();
          setMenuOpen(false);
        }}
        className="w-full flex items-center text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        Выход
      </button>
    </div>
  ) : (
    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-dark-border flex flex-col space-y-3">
      <Link
        to="/login"
        className="flex items-center text-base font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
        onClick={() => setMenuOpen(false)}
      >
        <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Войти
      </Link>
      <Link
        to="/signup"
        className="flex items-center justify-center px-4 py-2 rounded-lg text-white bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md transition-all"
        onClick={() => setMenuOpen(false)}
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Регистрация
      </Link>
    </div>
  );

  return (
    <header className="bg-white dark:bg-dark-lighter backdrop-blur-sm border-b border-gray-200 dark:border-dark-border sticky top-0 z-40 shadow-sm animate-fadeInUp">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 opacity-50"></div>
      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  {isDarkMode ? (
                    "J"
                  ) : (
                    <img src={logoSvg} alt="JumysAL Logo" className="w-6 h-6" />
                  )}
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  JumysAL
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8 items-center">
              <NavLinks />
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <UserActions />
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleDarkMode}
              className="p-2 w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-border mr-2 flex items-center justify-center"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 w-10 h-10 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-dark focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {menuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`lg:hidden fixed inset-0 z-50 transform ${menuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'} transition-opacity transition-transform duration-300 ease-in-out`}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)}></div>
        <div className="relative bg-white dark:bg-dark-lighter min-h-screen w-full max-w-sm p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
              <img src={logoSvg} alt="JumysAl" className="h-8" />
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-6">
            <NavLinks />
          </div>
          {mobilUserMenu}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

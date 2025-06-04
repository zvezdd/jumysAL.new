import React, { useState, useRef, useEffect } from 'react';
import { MicroMessage } from '../types';

interface MicroAIChatProps {
  microInternshipId: string;
  messages: MicroMessage[];
  onSendMessage: (message: string, senderType?: 'student' | 'employer' | 'ai') => void;
}

const MicroAIChat: React.FC<MicroAIChatProps> = ({ microInternshipId, messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Demo AI responses
  const demoResponses = [
    "Для этой задачи я рекомендую использовать компонентную структуру. Разделите интерфейс на логические части: Header, Features, Testimonials, ContactForm и Footer.",
    "Хороший вопрос! Для валидации формы вы можете использовать библиотеку formik или react-hook-form. Они значительно упрощают процесс валидации и управления состоянием форм.",
    "Чтобы сделать ваш сайт отзывчивым, используйте классы Tailwind, такие как 'md:', 'lg:' и 'xl:' для разных точек останова. Например: 'flex-col md:flex-row'.",
    "Для создания карусели отзывов я предлагаю использовать swiper.js или react-slick. Они предоставляют множество опций настройки и хорошую производительность.",
    "Для анимации можно использовать простые классы Tailwind, например группа hover:transform hover:scale-105 transition-all, или более продвинутые библиотеки как framer-motion для сложных анимаций."
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    onSendMessage(newMessage);
    setNewMessage('');

    // Simulate AI typing
    setIsTyping(true);
    setTimeout(() => {
      const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      onSendMessage(randomResponse, 'ai');
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-dark-lighter rounded-lg shadow-md overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 bg-gray-50 dark:bg-dark border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI-ментор
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Задавайте вопросы и получайте подсказки от AI-ментора
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message */}
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div className="ml-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-[80%]">
            <p>
              Привет! Я ваш AI-ментор. Я помогу вам с выполнением этой микро-стажировки.
              Вы можете задавать мне вопросы о технических аспектах задания, просить совета
              или объяснения. Чем я могу помочь вам сегодня?
            </p>
          </div>
        </div>
        
        {/* Message history */}
        {messages.map((message, index) => (
          <div key={index} className={`flex items-start ${message.senderType === 'student' ? 'justify-end' : ''}`}>
            {message.senderType !== 'student' && (
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
            )}
            <div 
              className={`ml-3 max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                message.senderType === 'student'
                  ? 'bg-primary text-white dark:bg-accent'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-gray-700 dark:text-gray-300'
              }`}
            >
              <p>{message.text}</p>
              {message.attachmentUrl && (
                <div className="mt-2">
                  <a 
                    href={message.attachmentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline"
                  >
                    Прикрепленный файл
                  </a>
                </div>
              )}
            </div>
            {message.senderType === 'student' && (
              <div className="ml-3 flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary dark:bg-accent flex items-center justify-center text-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* AI typing indicator */}
        {isTyping && (
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div className="ml-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg px-4 py-3 text-gray-700 dark:text-gray-300">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-2 w-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="px-4 py-3 bg-gray-50 dark:bg-dark border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Задайте вопрос AI-ментору..."
            className="flex-1 px-4 py-2 bg-white dark:bg-dark-lighter border border-gray-300 dark:border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary hover:bg-primary-dark dark:bg-accent dark:hover:bg-accent-dark text-white rounded-r-lg"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default MicroAIChat; 
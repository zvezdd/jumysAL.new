import React, { useEffect, useState, useRef } from 'react';
import { generateText } from '../api/gemini';
import { useAuth } from '../context/AuthContext';

interface Message {
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const AIMentor = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      content: 'Здравствуйте! Я ваш ИИ-карьерный наставник. Чем могу помочь в вашем профессиональном пути сегодня?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [suggestions] = useState([
    'Как улучшить мое резюме?',
    'Какие навыки востребованы для фронтенд-разработчиков?',
    'Советы для подготовки к собеседованиям',
    'Карьерный рост в IT',
    'Как обсудить зарплату?'
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent | null, suggestedMessage?: string) => {
    if (e) e.preventDefault();
    
    const userMessage = suggestedMessage || input;
    if (!userMessage.trim()) return;

    // Добавление сообщения пользователя
    const userMsg: Message = {
      content: userMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Формируем персонализированный запрос
      let prompt = userMessage;
      
      // Если пользователь авторизован, добавляем персонализацию
      if (user) {
        const role = user.displayName ? `${user.displayName}` : 'пользователь';
        prompt = `[Запрос от ${role}]: ${userMessage}`;
      }
      
      // Формируем контекст из предыдущих сообщений (максимум 5 последних)
      const recentMessages = messages.slice(-5).map(msg => 
        `${msg.sender === 'user' ? 'Пользователь' : 'ИИ'}: ${msg.content}`
      ).join('\n\n');
      
      if (recentMessages) {
        prompt = `Недавний диалог:\n${recentMessages}\n\nНовый вопрос: ${prompt}`;
      }
      
      // Вызываем Gemini API
      const response = await generateText(prompt);
      
      if (response.success) {
        const aiMsg: Message = {
          content: response.data,
          sender: 'ai',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMsg]);
      } else {
        // Обработка ошибки
        const errorMsg: Message = {
          content: "Извините, сейчас не могу обработать ваш запрос. Пожалуйста, попробуйте позже.",
          sender: 'ai',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMsg]);
        console.error('Ошибка от Gemini API:', response.error);
      }
    } catch (error) {
      console.error('Ошибка в ИИ-менторе:', error);
      const errorMsg: Message = {
        content: "Извините, что-то пошло не так. Пожалуйста, попробуйте позже.",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', { 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: false 
    }).format(date);
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-dark overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-pulse"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05] pointer-events-none"></div>
      
      {/* Декоративные элементы */}
      <div className="absolute top-40 right-[10%] w-64 h-64 bg-primary/5 rounded-full filter blur-3xl animate-pulse opacity-70 dark:opacity-10"></div>
      <div className="absolute bottom-40 left-[5%] w-64 h-64 bg-accent/5 rounded-full filter blur-3xl animate-pulse opacity-70 dark:opacity-10"></div>
      
      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-12 animate-fadeInUp">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Ваш ИИ <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Карьерный наставник</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Получите персонализированные карьерные советы, рекомендации по резюме и помощь в подготовке к собеседованиям
          </p>
        </div>
        <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-card overflow-hidden flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] sm:max-w-[70%] p-4 rounded-xl ${
                      message.sender === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-white rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line">{message.content}</div>
                    <div 
                      className={`text-xs mt-1 ${
                        message.sender === 'user' 
                          ? 'text-primary-lighter' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-white p-4 rounded-xl rounded-tl-none max-w-[80%] sm:max-w-[70%]">
                    <div className="flex space-x-2 items-center">
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">Думаю...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Предложения */}
          {messages.length < 3 && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-dark-border">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Предложенные вопросы:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSubmit(null, suggestion)}
                    className="text-sm bg-gray-100 dark:bg-dark hover:bg-gray-200 dark:hover:bg-dark-border text-gray-800 dark:text-gray-300 px-3 py-1.5 rounded-full transition-colors"
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Область ввода */}
          <div className="border-t border-gray-100 dark:border-dark-border p-4">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Задайте ваш карьерный вопрос..."
                className="flex-1 border-gray-300 dark:border-dark-border focus:ring-primary focus:border-primary rounded-lg dark:bg-dark dark:text-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Отправить
              </button>
            </form>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              Ваш ИИ-ментор здесь, чтобы помочь с карьерными советами, но результаты могут варьироваться. Для важных решений рассмотрите консультацию с профессиональным карьерным консультантом.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIMentor;
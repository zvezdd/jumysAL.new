import React from 'react';

export interface Filters {
  city: string;
  category: string;
  format: string;
  experience: string;
  salary: string;
  search: string;
}

interface FilterPanelProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  resultCount: number;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, setFilters, resultCount }) => {
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    setFilters({
      city: '',
      category: '',
      format: '',
      experience: '',
      salary: '',
      search: ''
    });
  };

  const cityOptions = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Другой'];
  const categoryOptions = ['IT', 'Маркетинг', 'Дизайн', 'Финансы', 'Образование', 'HR', 'Медицина', 'Юриспруденция', 'Другое'];
  const formatOptions = ['Офис', 'Онлайн', 'Гибрид'];
  const experienceOptions = ['Без опыта', '1-3 года', '3-5 лет', '5+ лет'];
  const salaryRanges = [
    'До 200 000 тг',
    '200 000 - 400 000 тг',
    '400 000 - 600 000 тг',
    '600 000 - 800 000 тг',
    '800 000 - 1 000 000 тг',
    'Более 1 000 000 тг'
  ];

  return (
    <div className="bg-white/10 p-6 rounded-xl mb-6 backdrop-blur-md shadow-lg">
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[300px]">
          <input
            type="text"
            placeholder="🔍 Поиск по ключевым словам..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full bg-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            📍 Город
          </label>
          <select
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="w-full bg-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="">Все города</option>
            {cityOptions.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🧠 Категория
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full bg-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="">Все категории</option>
            {categoryOptions.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🌐 Формат работы
          </label>
          <select
            value={filters.format}
            onChange={(e) => handleFilterChange('format', e.target.value)}
            className="w-full bg-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="">Все форматы</option>
            {formatOptions.map(format => (
              <option key={format} value={format}>{format}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            💼 Опыт работы
          </label>
          <select
            value={filters.experience}
            onChange={(e) => handleFilterChange('experience', e.target.value)}
            className="w-full bg-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="">Любой опыт</option>
            {experienceOptions.map(exp => (
              <option key={exp} value={exp}>{exp}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            💰 Зарплата
          </label>
          <select
            value={filters.salary}
            onChange={(e) => handleFilterChange('salary', e.target.value)}
            className="w-full bg-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="">Любая зарплата</option>
            {salaryRanges.map(range => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-white">
          <span className="font-semibold">{resultCount}</span> {resultCount === 1 ? 'вакансия' : 'вакансий'} найдено
        </div>
        
        {(filters.city || filters.category || filters.format || filters.experience || filters.salary || filters.search) && (
          <button
            onClick={resetFilters}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterPanel; 
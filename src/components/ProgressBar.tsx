import React from 'react';
import { LEVELS } from '../utils/points';

interface ProgressBarProps {
  currentXp: number;
  level: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentXp, level, className = '' }) => {
  const currentLevel = LEVELS.find(l => l.level === level) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === level + 1) || currentLevel;
  
  const xpForCurrentLevel = currentLevel.xpRequired;
  const xpForNextLevel = nextLevel.xpRequired;
  const xpProgress = currentXp - xpForCurrentLevel;
  const xpRequired = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = (xpProgress / xpRequired) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm text-gray-400">
        <span>Уровень {level}</span>
        <span>{xpProgress} / {xpRequired} XP</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar; 
import { Post } from '../types';
import { BookmarkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  isSaved?: boolean;
  onSave?: (postId: string) => void;
  onApply?: (post: Post) => void;
}

export default function PostCard({ post, isSaved = false, onSave, onApply }: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSave) {
      onSave(post.id);
    }
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onApply) {
      onApply(post);
    }
  };

  // Format date to string
  const formatDate = (date: Date | string): string => {
    if (!date) return '';
    const postDate = date instanceof Date ? date : new Date(date);
    return postDate.toLocaleDateString();
  };

  return (
    <div
      className="group relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background animation on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
      
      <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-card hover:shadow-card-hover p-6 transition-all duration-300 relative">
        {/* Card header with company info */}
        <div className="flex items-start mb-4">
          <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-border mr-3 flex-shrink-0">
            <img 
              src={post.companyLogo || '/placeholder-company.png'} 
              alt={post.companyName} 
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {post.companyName}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {post.location}
              </span>
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent rounded-full">
                {post.employmentType}
              </span>
            </div>
          </div>
          
          {/* Save button */}
          <button 
            onClick={handleSaveClick}
            className={`ml-auto p-2 rounded-full transition-colors ${
              isSaved 
                ? 'text-primary dark:text-accent' 
                : 'text-gray-400 hover:text-primary dark:hover:text-accent'
            }`}
            aria-label={isSaved ? "Unsave job" : "Save job"}
          >
            <svg 
              className="w-5 h-5" 
              fill={isSaved ? "currentColor" : "none"} 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
              />
            </svg>
          </button>
        </div>

        <Link to={`/posts/${post.id}`} className="block mt-4">
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-primary dark:hover:text-accent transition-colors">
            {post.title}
          </h4>
          <p className="mt-2 text-gray-600 dark:text-gray-400 line-clamp-2">
            {post.description}
          </p>
        </Link>

        <div className="mt-4 flex flex-wrap gap-2">
          {post.skills && post.skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 text-sm bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {post.employmentType}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {post.experienceLevel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(post.postedDate)}
            </span>
            <span className="text-sm font-medium text-primary dark:text-accent">
              {post.salary}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Link
            to={`/posts/${post.id}`}
            className="text-primary dark:text-accent hover:underline"
          >
            View Details
          </Link>
          <button 
            onClick={handleApplyClick}
            className="px-6 py-2 bg-primary hover:bg-primary/90 dark:bg-accent dark:hover:bg-accent/90 text-white rounded-lg transition-colors"
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
} 
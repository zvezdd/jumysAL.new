import { forwardRef, InputHTMLAttributes } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helper, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            {...props}
            className={`
              form-input
              block
              w-full
              rounded-lg
              border-gray-300
              dark:border-dark-border
              bg-white
              dark:bg-dark-lighter
              text-gray-900
              dark:text-white
              placeholder-gray-400
              dark:placeholder-gray-500
              focus:border-primary
              dark:focus:border-accent
              focus:ring
              focus:ring-primary/20
              dark:focus:ring-accent/20
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition-colors
              duration-200
              ${error ? 'border-red-500 dark:border-red-400' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : helper ? `${props.id}-helper` : undefined}
          />
          {error && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
          )}
        </div>
        {(error || helper) && (
          <p
            className={`mt-1 text-sm ${
              error
                ? 'text-red-500 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            id={error ? `${props.id}-error` : `${props.id}-helper`}
          >
            {error || helper}
          </p>
        )}
      </div>
    );
  }
); 
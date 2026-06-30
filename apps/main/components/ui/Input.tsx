import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, className = '', ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-on-surface-variant">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`bg-surface-container-lowest rounded-lg px-4 py-3 text-on-surface outline outline-1 outline-outline-variant/15 transition-all placeholder:text-on-surface-variant/50 focus:outline-2 focus:outline-primary ${className}`}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;

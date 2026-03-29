import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  highlighted?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ highlighted = false, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl ${highlighted ? 'bg-surface-container-high' : 'bg-surface-container-lowest'} p-6 transition-colors hover:bg-surface-variant ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export default Card;

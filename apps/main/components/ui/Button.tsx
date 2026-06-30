import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-linear-to-br from-primary to-primary-container text-white rounded-lg px-12 py-3 font-medium hover:-translate-y-px hover:shadow-ambient',
  secondary:
    'bg-secondary-container text-on-secondary-container rounded-lg px-12 py-3 font-medium hover:-translate-y-px hover:shadow-ambient',
  tertiary:
    'bg-transparent text-primary rounded-lg px-6 py-3 font-medium hover:bg-surface-container-low',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${variantStyles[variant]} transition-all ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;

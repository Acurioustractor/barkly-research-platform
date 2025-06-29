import React from 'react';
import { cn } from '@/utils/cn';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  as?: React.ElementType;
}

/**
 * Container component for consistent page layout and spacing
 * Provides responsive max-width constraints
 */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', as: Component = 'div', ...props }, ref) => {
    const sizes = {
      sm: 'max-w-3xl',
      md: 'max-w-5xl',
      lg: 'max-w-7xl',
      xl: 'max-w-screen-2xl',
      full: 'max-w-full'
    };

    return (
      <Component
        ref={ref}
        className={cn(
          'mx-auto w-full px-4 sm:px-6 lg:px-8',
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Container.displayName = 'Container';
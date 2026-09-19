import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'panel' | 'card' | 'marketplace';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ variant = 'panel', hover, className, children, ...props }) => (
  <div
    className={cn(
      variant === 'marketplace' ? 'fiverr-card' : hover ? 'glass-card' : 'glass-panel',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export default Card;
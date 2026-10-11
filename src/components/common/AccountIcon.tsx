import React from 'react';
import { Wallet } from 'lucide-react';
import { AccountType } from '../../types';

interface AccountIconProps {
  type?: AccountType | string;
  name?: string;
  color?: string;
  size?: number;
  className?: string;
  showBackground?: boolean;
}

export const AccountIcon: React.FC<AccountIconProps> = ({
  color = '#3B82F6',
  size = 18,
  className = '',
  showBackground = false,
}) => {
  if (showBackground) {
    return (
      <div 
        className={`inline-flex items-center justify-center rounded-xl border transition-all shadow-2xs ${className}`}
        style={{ 
          backgroundColor: `${color}16`,
          borderColor: `${color}35`,
          color: color,
        }}
      >
        <Wallet size={size} />
      </div>
    );
  }

  return (
    <span 
      className={`inline-flex items-center justify-center ${className}`}
      style={{ color }}
    >
      <Wallet size={size} />
    </span>
  );
};


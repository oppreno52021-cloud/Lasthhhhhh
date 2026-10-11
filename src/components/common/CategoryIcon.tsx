import React from 'react';
import { 
  Utensils, 
  Coffee,
  ShoppingCart, 
  Car, 
  Fuel,
  Bus,
  Receipt, 
  Zap,
  Droplets,
  Wifi,
  ShoppingBag, 
  Shirt,
  HeartPulse, 
  Pill,
  Film, 
  Tv,
  Gamepad2,
  GraduationCap, 
  BookOpen,
  Home,
  Dumbbell,
  Plane, 
  Gift, 
  HandHeart,
  Briefcase,
  Laptop,
  Tag,
  User, 
  MoreHorizontal
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  color?: string;
  size?: number;
  className?: string;
  showBackground?: boolean;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  color = '#2563EB',
  size = 20,
  className = '',
  showBackground = false,
}) => {
  const getIcon = () => {
    switch (name) {
      case 'Utensils': return <Utensils size={size} />;
      case 'Coffee': return <Coffee size={size} />;
      case 'ShoppingCart': return <ShoppingCart size={size} />;
      case 'Car': return <Car size={size} />;
      case 'Fuel': return <Fuel size={size} />;
      case 'Bus': return <Bus size={size} />;
      case 'Receipt': return <Receipt size={size} />;
      case 'Zap': return <Zap size={size} />;
      case 'Droplets': return <Droplets size={size} />;
      case 'Wifi': return <Wifi size={size} />;
      case 'ShoppingBag': return <ShoppingBag size={size} />;
      case 'Shirt': return <Shirt size={size} />;
      case 'HeartPulse': return <HeartPulse size={size} />;
      case 'Pill': return <Pill size={size} />;
      case 'Film': return <Film size={size} />;
      case 'Tv': return <Tv size={size} />;
      case 'Gamepad2': return <Gamepad2 size={size} />;
      case 'GraduationCap': return <GraduationCap size={size} />;
      case 'BookOpen': return <BookOpen size={size} />;
      case 'Home': return <Home size={size} />;
      case 'Dumbbell': return <Dumbbell size={size} />;
      case 'Plane': return <Plane size={size} />;
      case 'Gift': return <Gift size={size} />;
      case 'HandHeart': return <HandHeart size={size} />;
      case 'Briefcase': return <Briefcase size={size} />;
      case 'Laptop': return <Laptop size={size} />;
      case 'Tag': return <Tag size={size} />;
      case 'User': return <User size={size} />;
      default: return <MoreHorizontal size={size} />;
    }
  };

  if (!showBackground) {
    return (
      <span style={{ color }} className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {getIcon()}
      </span>
    );
  }

  return (
    <div
      style={{
        backgroundColor: `${color}18`,
        color: color,
        boxShadow: `0 0 10px ${color}12`,
      }}
      className={`inline-flex items-center justify-center rounded-full p-2.5 shrink-0 transition-transform ${className}`}
    >
      {getIcon()}
    </div>
  );
};

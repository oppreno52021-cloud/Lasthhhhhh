import React, { useState } from 'react';
import { CATEGORY_ICON_PRESETS, ACCOUNT_ICON_PRESETS, StyledIconChoice } from '../../utils/iconPresets';
import { CategoryIcon } from './CategoryIcon';
import { AccountIcon } from './AccountIcon';
import { Check } from 'lucide-react';

interface StyledIconSelectorProps {
  selectedIcon: string;
  selectedColor?: string;
  onSelect: (icon: string, color: string) => void;
  language?: string;
  targetType?: 'account' | 'category';
}

export const StyledIconSelector: React.FC<StyledIconSelectorProps> = ({
  selectedIcon,
  selectedColor,
  onSelect,
  language = 'ar',
  targetType = 'category',
}) => {
  const isAccount = targetType === 'account';
  const presets: StyledIconChoice[] = isAccount ? ACCOUNT_ICON_PRESETS : CATEGORY_ICON_PRESETS;
  const [hoveredItem, setHoveredItem] = useState<StyledIconChoice | null>(null);

  // Find currently active item
  const activeItem = presets.find(
    p => p.icon === selectedIcon && (!selectedColor || p.color === selectedColor)
  ) || presets.find(p => p.icon === selectedIcon) || presets[0];

  const displayedItem = hoveredItem || activeItem;

  return (
    <div className="space-y-2">
      {/* Header and Live Preview Badge */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {isAccount 
            ? (language === 'ar' ? 'وسيلة الدفع واللون:' : 'Payment Instrument & Color:')
            : (language === 'ar' ? 'أيقونة الفئة ولونها:' : 'Category Icon & Color:')}
        </label>

        {/* Live label preview on hover or selection */}
        {displayedItem && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-750 transition-all">
            <span 
              className="w-2 h-2 rounded-full shrink-0" 
              style={{ backgroundColor: displayedItem.color }} 
            />
            <span className="truncate max-w-[130px]">
              {language === 'ar' ? displayedItem.nameAr : displayedItem.nameEn}
            </span>
            {hoveredItem && (
              <span className="text-[9px] text-blue-500 font-normal">
                {language === 'ar' ? '(استعراض)' : '(preview)'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grid of Icons with Refined Micro-Interactions */}
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 max-h-52 overflow-y-auto no-scrollbar p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
        {presets.map(item => {
          const isSelected = selectedIcon === item.icon || (selectedColor && selectedColor === item.color && selectedIcon === item.icon);
          const isHovered = hoveredItem?.id === item.id;
          
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.icon, item.color)}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
              title={language === 'ar' ? item.nameAr : item.nameEn}
              className="group relative flex flex-col items-center justify-center p-1 cursor-pointer select-none outline-hidden focus:outline-hidden"
            >
              {/* Icon Bubble with dynamic aura and smooth transform */}
              <div 
                className={`relative w-9 h-9 rounded-2xl flex items-center justify-center text-white transition-all duration-200 ease-out active:scale-90 ${
                  isSelected
                    ? 'scale-110 shadow-md ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                    : 'group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:shadow-md'
                }`}
                style={{ 
                  backgroundColor: item.color,
                  boxShadow: isSelected 
                    ? `0 6px 18px ${item.color}55` 
                    : isHovered 
                      ? `0 6px 16px ${item.color}45` 
                      : `0 2px 6px ${item.color}25`,
                  borderColor: isSelected ? '#FFFFFF' : `${item.color}40`,
                }}
              >
                {isAccount ? (
                  <AccountIcon name={item.icon} color="#FFFFFF" size={17} />
                ) : (
                  <CategoryIcon name={item.icon} color="#FFFFFF" size={17} />
                )}

                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xs ring-1 ring-white dark:ring-slate-900 animate-in zoom-in-50 duration-150">
                    <Check size={10} strokeWidth={3.5} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};


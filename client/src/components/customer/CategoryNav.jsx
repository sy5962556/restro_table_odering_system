import React from 'react';
import { 
  Flame, 
  Soup, 
  UtensilsCrossed, 
  Cookie, 
  Sparkles, 
  GlassWater, 
  Cake, 
  Utensils,
  Layers
} from 'lucide-react';

const iconMap = {
  Flame: Flame,
  Soup: Soup,
  UtensilsCrossed: UtensilsCrossed,
  Cookie: Cookie,
  Sparkles: Sparkles,
  GlassWater: GlassWater,
  Cake: Cake,
  Utensils: Utensils,
  Layers: Layers
};

export const CategoryNav = ({ categories = [], activeCategory, onSelectCategory }) => {
  return (
    <div className="sticky top-[68px] z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 py-2.5 shadow-sm">
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 max-w-4xl mx-auto">
        <button
          onClick={() => onSelectCategory('ALL')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
            activeCategory === 'ALL'
              ? 'bg-brand-500 text-white shadow-glow scale-[1.02]'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Items</span>
        </button>

        {categories.map((cat) => {
          const IconComponent = iconMap[cat.icon] || Utensils;
          const isSelected = activeCategory === cat._id;

          return (
            <button
              key={cat._id}
              onClick={() => onSelectCategory(cat._id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                isSelected
                  ? 'bg-brand-500 text-white shadow-glow scale-[1.02]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryNav;

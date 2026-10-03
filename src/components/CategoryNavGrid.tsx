import React from 'react';
import { CategorySlider, HOME_CATEGORIES } from './CategorySlider';

export { HOME_CATEGORIES };

export interface CategoryNavGridProps {
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
}

export const CategoryNavGrid: React.FC<CategoryNavGridProps> = React.memo(({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <CategorySlider
      selectedCategory={selectedCategory}
      onSelectCategory={onSelectCategory}
      title="Shop By Category"
      subtitle="Discover our handpicked collection across top categories"
    />
  );
});

export default CategoryNavGrid;

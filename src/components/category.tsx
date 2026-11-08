import React from 'react';
import CategoryModel from '../modules/models/category';
import Subcategory from '../modules/models/subcategory';
import SubcategoryComponent from './subcategory';
import classNames from "classnames";

const Category = ({ category }: { category: CategoryModel }) => {
  const hasVisibleContent = category.content.some((el: Subcategory) => el.table.length > 0);
  return (
    <div className={classNames("rounded-md bg-gray-100 dark:bg-gray-800 pt-4 m-2 overflow-hidden", {
      "bg-opacity-20": !hasVisibleContent,
    })}>
      <a href={category.link} target="_blank" rel="noopener noreferrer">
        <h2 className={classNames("px-3 py-2 mx-3 mb-2 font-bold text-gray-800 dark:bg-gray-700 dark:text-gray-200 tracking-wider bg-gray-200 rounded-md hover:bg-primary dark:hover:bg-primary", {
          "bg-opacity-10": !hasVisibleContent,
          "text-opacity-20": !hasVisibleContent
        })}>{category.title}</h2>
      </a>
      {
        category.content.map((subcategory: Subcategory) => {
          return subcategory.table.length > 0 && <SubcategoryComponent key={subcategory.parameter} subcategory={subcategory} />;
        })
      }
    </div>
  )
};

export default Category;

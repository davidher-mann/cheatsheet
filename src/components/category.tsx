import React, { useState, MouseEvent } from 'react';
import Subcategory from '../modules/models/subcategory';
import SubcategoryComponent from './subcategory';
import classNames from "classnames";


const onClickLink = (event: MouseEvent<HTMLAnchorElement>): void => {
  event.stopPropagation();
};

const Category = ({ category }: any) => {
  let hasVisibleContent = category.content.filter((el: Subcategory) => el.table.length).length > 0
  return (
    <div className={classNames("rounded-md bg-gray-100 dark:bg-gray-800 pt-4 m-2 overflow-hidden", {
      "bg-opacity-20": !hasVisibleContent,
    })}>
<a
  href={category.link}
  target="_blank"
  rel="noopener noreferrer"
  onClick={onClickLink}
>
<h2 className={classNames("px-3 py-2 mx-3 mb-2 font-bold text-gray-800 dark:bg-gray-700 dark:text-gray-200 tracking-wider bg-gray-200 rounded-md hover:bg-primary dark:hover:bg-primary", {
  "bg-opacity-10": !hasVisibleContent,
  "text-opacity-20": !hasVisibleContent
})}>{category.title}</h2>
</a>
      {
        category.content.map((subcategory: Subcategory, index: Number) => {
          return subcategory.table.length > 0 && <SubcategoryComponent key={'Subcat-' + index} subcategory={subcategory}/>;
        })
      }
    </div>
  )
};

export default Category;

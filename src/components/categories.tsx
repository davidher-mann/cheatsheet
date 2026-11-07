import React from 'react';
import Masonry from 'react-masonry-css';
import Category from '../modules/models/category';
import CategoryComponent from './category';

const Categories = ({ cheatsheet }: { cheatsheet: Category[] }) => {
    return (
        <section className="dark:bg-gray-900 lg:pt-24">
            <h1 className="pt-6 text-3xl font-semibold text-center text-gray-800 dark:text-gray-200">
                Non-official Snowplow Analytics Tracker Protocol Cheat Sheet
            </h1>

            <p className="max-w-6xl px-4 mx-auto mt-4 text-base text-center text-gray-500 dark:text-gray-400 md:text-lg">
                Quickly find all Snowplow Tracker Protocol parameters
            </p>

            <p className="max-w-6xl px-4 mx-auto mt-4 text-sm italic text-center text-gray-500 dark:text-gray-400">
                <sup>&#9432;</sup> This is non-official documentation based on the official Snowplow docs. Changes may happen without further notice.
            </p>
            
            <Masonry
                breakpointCols={{
                    default: 4,
                    1280: 3,
                    1024: 2,
                    768: 2,
                    640: 1
                }}
                className="flex flex-wrap p-4 mx-auto mt-4"
                columnClassName="w-auto">
                {
                    cheatsheet.map((category: Category) => <CategoryComponent key={category.title} category={category} />)
                }
            </Masonry>
        </section>
    );
}

export default Categories;

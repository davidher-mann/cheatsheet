    import React from 'react';
    import Masonry from 'react-masonry-css';
    import Category from '../modules/models/category';
    import CategoryComponent from './category';

    const Categories = (props: any) => {
        return (
            <section className="dark:bg-gray-900 lg:pt-24">
                <h1 className="pt-6 text-3xl font-semibold text-center text-gray-800 dark:text-gray-200">
                Non-official Snowplow Analytics Tracker Protocol Cheatsheet
                </h1>

                <p className="max-w-6xl px-4 mx-auto mt-4 text-base text-center text-gray-500 dark:text-gray-400 md:text-lg">
                    – Quickly find all Tracker Protocol Parameter – 
                </p>

                <p className="max-w-6xl px-2 mx-auto mt-4 text-base italic text-center text-gray-500 dark:text-gray-400 md:text-s">
                <sup>&#9432;</sup> This is a non-offical documentation, but based on the official. Changes may happen without further notice
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
                        props.cheatsheet.map((category: Category) => <CategoryComponent key={category.title} category={category} />)
                    }
                </Masonry>
            </section>
        );
    }

    export default Categories;

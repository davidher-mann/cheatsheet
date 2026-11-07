import React, { useState } from 'react';

import Category from '../modules/models/category';
import cheatsheetData from '../modules/cheatsheet.json';
import { filterCheatsheet } from '../utils/filterCheatsheet';

import SearchBar from '../components/searchBar';
import Categories from '../components/categories';
import Footer from '../components/footer';

const json = cheatsheetData as Category[];

// Dark by default: the Snowplow logo is white and only readable on a dark background.
const isDarkMode = (): boolean => {
    try {
        return JSON.parse(localStorage.getItem('darkMode') || 'true') !== false;
    } catch {
        return true;
    }
};

const Home = () => {
    const [cheatsheet, setCheatsheet] = useState<Category[]>(json);

    const search = (text: string) => {
        setCheatsheet(filterCheatsheet(json, text));
    };

    return (
        <main className={"tracking-wide font-roboto min-h-screen grid " + (isDarkMode() ? 'dark bg-gray-900' : '')}>
            <SearchBar search={search} />
            <Categories cheatsheet={cheatsheet} />
            <Footer />
        </main>
    );
}

export default Home;

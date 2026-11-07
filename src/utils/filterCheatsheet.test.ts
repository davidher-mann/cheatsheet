import { filterCheatsheet } from './filterCheatsheet';

const data: any[] = [{
    title: 'Layout',
    content: [
        { title: 'Container', description: 'Fixes width', table: [['container', 'width: 100%'], ['sm', 'max-width: 640px']] },
        { title: 'Flex', description: 'Flexbox', table: [['flex', 'display: flex']] },
    ],
}];

test('keeps whole table when title or description matches, ignoring case', () => {
    const result = filterCheatsheet(data, 'CONTAINER');
    expect(result[0].content[0].table).toHaveLength(2);
    expect(result[0].content[1].table).toHaveLength(0);
});

test('filters rows when only cells match', () => {
    const result = filterCheatsheet(data, 'max-width');
    expect(result[0].content[0].table).toEqual([['sm', 'max-width: 640px']]);
});

test('empty search keeps everything', () => {
    expect(filterCheatsheet(data, '')).toEqual(data);
});

test('finds Snowplow parameters case-insensitively in the real data', () => {
    const cheatsheet = require('../modules/cheatsheet.json');
    const visible = filterCheatsheet(cheatsheet, 'TIMESTAMP')
        .flatMap((category: any) => category.content)
        .filter((subcategory: any) => subcategory.table.length > 0)
        .map((subcategory: any) => subcategory.parameter);
    expect(visible).toEqual(expect.arrayContaining(['dtm', 'stm', 'ttm']));
});

test('finds subcategories by their parameter name', () => {
    const cheatsheet = require('../modules/cheatsheet.json');
    const visible = filterCheatsheet(cheatsheet, 'refr')
        .flatMap((category: any) => category.content)
        .filter((subcategory: any) => subcategory.table.length > 0)
        .map((subcategory: any) => subcategory.parameter);
    expect(visible).toContain('refr');
});

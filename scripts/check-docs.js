// Compares src/modules/cheatsheet.json with Snowplow's canonical event docs and
// reports cards whose column name differs from the docs, plus links whose page
// moved or whose #anchor no longer exists. Types are not compared:
// the cheat sheet gives the type of the value the tracker sends (dtm is an integer
// of milliseconds), the docs give the warehouse column's type (a timestamp).
// Run with: yarn check-docs (Node 18+, no dependencies).

const path = require('path');

const DOCS_URL = 'https://docs.snowplow.io/docs/fundamentals/canonical-event/';

// Parameters on the cheat sheet that mean something else than the docs property
// with the same name, so comparing them would give a false mismatch.
const SKIP = new Set([
    'cookie:Cookie', // HTTP Cookie header card, not the br_cookies payload property
]);

const decode = text => text
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

// The docs HTML leaves <tr>, <th> and <td> unclosed, so split on the opening tags.
const parseTables = html => [...html.matchAll(/<table[\s\S]*?<\/table>/g)].map(([table]) =>
    table.split(/<tr[^>]*>/).slice(1).map(row =>
        row.split(/<t[hd][^>]*>/).slice(1).map(decode)));

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Docs pages that moved are redirected to a different page instead of a 404,
// so a link is only fine if it stays on its own path and its anchor exists.
const checkLinks = async cheatsheet => {
    const links = new Set(cheatsheet.flatMap(category =>
        [category.link, ...category.content.map(card => card.link)]));
    const pages = new Map();
    const problems = [];
    for (const link of links) {
        const url = new URL(link);
        const pageUrl = url.origin + url.pathname;
        if (!pages.has(pageUrl)) {
            pages.set(pageUrl, fetch(pageUrl).then(async response => ({
                status: response.status,
                path: new URL(response.url).pathname,
                html: await response.text(),
            })));
        }
        const page = await pages.get(pageUrl);
        const anchor = decodeURIComponent(url.hash.slice(1));
        if (page.status !== 200) {
            problems.push(`${link}: returned ${page.status}`);
        } else if (page.path.replace(/\/$/, '') !== url.pathname.replace(/\/$/, '')) {
            problems.push(`${link}: redirects to ${page.path}`);
        } else if (anchor && !new RegExp(`id=["']?${escapeRegExp(anchor)}["'\\s>]`).test(page.html)) {
            problems.push(`${link}: anchor #${anchor} not found`);
        }
    }
    return { count: links.size, problems };
};

const main = async () => {
    const response = await fetch(DOCS_URL);
    if (!response.ok) throw new Error(`${DOCS_URL} returned ${response.status}`);
    const tables = parseTables(await response.text());

    const docs = new Map();
    for (const [header, ...rows] of tables) {
        if (header[0] !== 'Payload property' || header[1] !== 'Field name') continue;
        for (const row of rows) {
            for (const property of row[0].split(/[\s,]+/).filter(Boolean)) {
                // One property can fill several columns, e.g. res → dvce_screenwidth and dvce_screenheight.
                docs.set(property, [...(docs.get(property) ?? []), row[1]]);
            }
        }
    }
    if (docs.size === 0) throw new Error('No parameter tables found; the docs page layout has probably changed.');

    const cheatsheet = require(path.join(__dirname, '../src/modules/cheatsheet.json'));
    const problems = [];
    const notInDocs = [];

    for (const category of cheatsheet) {
        for (const card of category.content) {
            if (SKIP.has(`${card.parameter}:${card.title}`)) continue;
            const expected = docs.get(card.parameter)?.slice().sort().join(' and ');
            if (!expected) {
                notInDocs.push(card.parameter);
                continue;
            }
            const fields = Object.fromEntries(card.table.map(([key, value]) => [key, value]));
            const label = `${category.title} › ${card.title} (${card.parameter})`;
            const column = fields['column_name:']?.split(' and ').sort().join(' and ');
            if (column !== expected) {
                problems.push(`${label}: column is ${column ?? 'missing'}, docs say ${expected}`);
            }
        }
    }

    const linkCheck = await checkLinks(cheatsheet);
    problems.push(...linkCheck.problems);

    console.log(`Checked against ${docs.size} documented parameters and ${linkCheck.count} links.`);
    if (notInDocs.length) console.log(`Not on the docs page (not checked): ${notInDocs.join(', ')}`);
    if (problems.length) {
        console.log(`\n${problems.length} difference(s):\n- ${problems.join('\n- ')}`);
        process.exitCode = 1;
    } else {
        console.log('No differences.');
    }
};

main().catch(error => {
    console.error(error.message);
    process.exitCode = 2;
});

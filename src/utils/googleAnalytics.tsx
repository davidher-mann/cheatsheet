import ReactGA from 'react-ga';

ReactGA.initialize('UA-');
let timeoutTrackSearch: any;

export const trackView = (viewName: string) => {
    ReactGA.pageview(viewName);
}
// TODO: change to dataLayer push instead of GA event
export const trackSearch = (searchText: string) => {
    clearTimeout(timeoutTrackSearch);

    timeoutTrackSearch = setTimeout(() => {
        ReactGA.event({
            category: "Search input",
            action: "Search in cheatsheet",
            label: searchText
        });
    }, 500);
}

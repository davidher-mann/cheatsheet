import Subcategory from "./subcategory";

export default interface Category {
    title: string;
    link: string;
    content: Subcategory[];
}

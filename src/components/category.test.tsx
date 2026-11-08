import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('use-bus', () => () => {});

import Category from './category';
import CategoryModel from '../modules/models/category';

describe('Category component', () => {
    test('preserves subcategory open/closed state by parameter key across filtering', () => {
        const categoryData: CategoryModel = {
            title: 'Test Category',
            link: 'https://example.com',
            content: [
                {
                    title: 'First Subcategory',
                    parameter: 'sub_one',
                    link: 'https://example.com/1',
                    description: 'Description 1',
                    table: [['col1', 'col2']],
                },
                {
                    title: 'Second Subcategory',
                    parameter: 'sub_two',
                    link: 'https://example.com/2',
                    description: 'Description 2',
                    table: [['col3', 'col4']],
                },
            ],
        };

        const { rerender } = render(<Category category={categoryData} />);

        // Expand the first subcategory
        const firstHeader = screen.getByText('First Subcategory');
        fireEvent.click(firstHeader);

        // Verify Description 1 is expanded (its container is not h-0)
        const desc1 = screen.getByText('Description 1');
        expect(desc1.parentElement?.className).not.toContain('h-0');

        // Description 2 is collapsed
        const desc2 = screen.getByText('Description 2');
        expect(desc2.parentElement?.className).toContain('h-0');

        // Now simulate search filter: 'First Subcategory' has empty table, so it's filtered out
        const filteredCategoryData: CategoryModel = {
            ...categoryData,
            content: [
                {
                    ...categoryData.content[0],
                    table: [], // filtered out
                },
                categoryData.content[1],
            ],
        };

        rerender(<Category category={filteredCategoryData} />);

        // Second Subcategory is now at position 0, but it should still be collapsed
        const desc2AfterFilter = screen.getByText('Description 2');
        expect(desc2AfterFilter.parentElement?.className).toContain('h-0');
    });
});

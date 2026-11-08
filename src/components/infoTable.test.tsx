import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import InfoTable from './infoTable';
import * as clipboardUtil from '../utils/copyTextToClipboard';

jest.mock('../utils/copyTextToClipboard');

describe('InfoTable', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('shows toast on click and auto-dismisses after 5 seconds', async () => {
        (clipboardUtil.copyTextToClipboard as jest.Mock).mockResolvedValue(undefined);

        render(<InfoTable table={[['param1', 'val1']]} />);
        const cell = screen.getByText('param1');

        await act(async () => {
            fireEvent.click(cell);
        });

        expect(screen.getByRole('alert')).toHaveTextContent('"param1" copied into your clipboard');

        // Fast forward 4 seconds - still visible
        act(() => {
            jest.advanceTimersByTime(4000);
        });
        expect(screen.getByRole('alert')).toBeInTheDocument();

        // Fast forward 1 more second - dismissed
        act(() => {
            jest.advanceTimersByTime(1000);
        });
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('re-clicking the same cell keeps toast for 5 seconds from the last click', async () => {
        (clipboardUtil.copyTextToClipboard as jest.Mock).mockResolvedValue(undefined);

        render(<InfoTable table={[['param1', 'val1']]} />);
        const cell = screen.getByText('param1');

        await act(async () => {
            fireEvent.click(cell);
        });
        expect(screen.getByRole('alert')).toBeInTheDocument();

        // Advance 3 seconds
        act(() => {
            jest.advanceTimersByTime(3000);
        });
        expect(screen.getByRole('alert')).toBeInTheDocument();

        // Click the same cell again
        await act(async () => {
            fireEvent.click(cell);
        });

        // Advance another 3 seconds (6s since first click, 3s since second click)
        act(() => {
            jest.advanceTimersByTime(3000);
        });
        // Toast is still visible
        expect(screen.getByRole('alert')).toBeInTheDocument();

        // Advance 2 more seconds (5s since second click)
        act(() => {
            jest.advanceTimersByTime(2000);
        });
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('shows error toast when copyTextToClipboard fails', async () => {
        (clipboardUtil.copyTextToClipboard as jest.Mock).mockRejectedValue(new Error('Permission denied'));

        render(<InfoTable table={[['param1', 'val1']]} />);
        const cell = screen.getByText('param1');

        await act(async () => {
            fireEvent.click(cell);
        });

        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Failed to copy "param1" to clipboard');
        expect(alert.className).toContain('bg-red-600');
    });
});

import { copyTextToClipboard } from './copyTextToClipboard';

describe('copyTextToClipboard', () => {
    const originalClipboard = navigator.clipboard;
    const originalExecCommand = document.execCommand;

    afterEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: originalClipboard,
            configurable: true,
            writable: true,
        });
        document.execCommand = originalExecCommand;
    });

    test('uses navigator.clipboard when available', async () => {
        const writeTextMock = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: writeTextMock },
            configurable: true,
            writable: true,
        });

        await copyTextToClipboard('test string');
        expect(writeTextMock).toHaveBeenCalledWith('test string');
    });

    test('throws when navigator.clipboard.writeText fails', async () => {
        const writeTextMock = jest.fn().mockRejectedValue(new Error('Write failed'));
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: writeTextMock },
            configurable: true,
            writable: true,
        });

        await expect(copyTextToClipboard('test string')).rejects.toThrow('Write failed');
    });

    test('falls back to execCommand when navigator.clipboard is unavailable and throws on failure', async () => {
        Object.defineProperty(navigator, 'clipboard', {
            value: undefined,
            configurable: true,
            writable: true,
        });

        document.execCommand = jest.fn().mockReturnValue(false);

        await expect(copyTextToClipboard('test string')).rejects.toThrow('Copy command failed');
        expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    test('falls back to execCommand when navigator.clipboard is unavailable and succeeds when copy returns true', async () => {
        Object.defineProperty(navigator, 'clipboard', {
            value: undefined,
            configurable: true,
            writable: true,
        });

        document.execCommand = jest.fn().mockReturnValue(true);

        await expect(copyTextToClipboard('test string')).resolves.toBeUndefined();
        expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
});

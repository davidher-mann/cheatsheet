export async function copyTextToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return;
    }

    // Fallback for insecure contexts / old browsers.
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        const successful = document.execCommand('copy');
        if (!successful) {
            throw new Error('Copy command failed');
        }
    } finally {
        document.body.removeChild(textarea);
    }
}

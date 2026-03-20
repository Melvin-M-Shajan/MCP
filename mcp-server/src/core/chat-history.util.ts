/**
 * Formats the chat history array from State into a readable string for LLM prompt injection.
 * Keeps only the last N turns to avoid excessive token usage.
 *
 * @param history  The chatHistory array from State (each item: { role: string; content: string })
 * @param maxTurns The maximum number of message turns to include (default: 10)
 * @returns A formatted string section ready to be inserted into a prompt, or an empty string if no history.
 */
export function formatChatHistory(history: any[], maxTurns = 10): string {
    if (!history || history.length === 0) {
        return '';
    }

    // Exclude the current user message (it was pushed before agents run, so it's the last entry)
    const previousHistory = history.slice(0, -1);

    if (previousHistory.length === 0) {
        return '';
    }

    // Take only the last N turns to keep token count manageable
    const recentHistory = previousHistory.slice(-maxTurns);

    const formatted = recentHistory.map((entry: any) => {
        const roleLabel = entry.role === 'user' ? 'User' : 'Assistant';
        // Truncate very long assistant responses (e.g. large JSON dumps) to save tokens
        const content = typeof entry.content === 'string' && entry.content.length > 500
            ? entry.content.slice(0, 500) + '... [truncated]'
            : String(entry.content ?? '');
        return `[${roleLabel}]: ${content}`;
    });

    return `Conversation History (most recent last):\n${formatted.join('\n')}`;
}

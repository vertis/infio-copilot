import { TFile } from 'obsidian'

/**
 * Applies changes to a file by replacing content within specified line range
 * @param content - The new content to insert
 * @param currentFile - The file being modified
 * @param currentFileContent - The current content of the file
 * @param startLine - Starting line number (1-based indexing, optional)
 * @param endLine - Ending line number (1-based indexing, optional)
 * @returns Promise resolving to the modified content or null if operation fails
 */
export const manualApplyChangesToFile = async (
    content: string,
    currentFile: TFile,
    currentFileContent: string,
    startLine?: number,
    endLine?: number,
): Promise<string | null> => {
    try {
        // Input validation
        if (!content || !currentFileContent) {
            throw new Error('Content cannot be empty')
        }

        const lines = currentFileContent.split('\n')
        const effectiveStartLine = Math.max(1, startLine ?? 1)
        const effectiveEndLine = Math.min(endLine ?? lines.length, lines.length)

        // Validate line numbers
        if (effectiveStartLine > effectiveEndLine) {
            throw new Error('Start line cannot be greater than end line')
        }

        // Construct new content
        return [
            ...lines.slice(0, effectiveStartLine - 1),
            content,
            ...lines.slice(effectiveEndLine)
        ].join('\n')
    } catch (error) {
        console.error('Error applying changes:', error instanceof Error ? error.message : 'Unknown error')
        return null
    }
}

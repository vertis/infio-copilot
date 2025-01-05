/**
 * Removes AI code block tags from content
 * @param content The content to filter
 * @returns The filtered content without AI code block tags
 */
export const removeAITags = (content: string): string => {
	// Remove ```infioedit\n and ``` tags
	return content.replace(/```infioedit\n```\n/g, '');
}

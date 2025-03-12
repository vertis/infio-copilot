export function getCapabilitiesSection(
	cwd: string,
	searchTool: string, 
): string {

	const searchInstructions = searchTool === 'regex'
	? "\n- You can use regex_search_files to perform pattern-based searches across files using regular expressions. This tool is ideal for finding exact text matches, specific patterns (like tags, links, dates, URLs), or structural elements in notes. It excels at locating precise format patterns and is perfect for finding connections between notes, frontmatter elements, or specific Markdown formatting."
	: searchTool === 'semantic'
		? "\n- You can use semantic_search_files to find content based on meaning rather than exact text matches. Semantic search uses embedding vectors to understand concepts and ideas, finding relevant content even when keywords differ. This is especially powerful for discovering thematically related notes, answering conceptual questions about your knowledge base, or finding content when you don't know the exact wording used in the notes."
		: "";

	return `====

CAPABILITIES

- You have access to tools that let you list files, search content, read and write files, and ask follow-up questions. These tools help you effectively accomplish a wide range of tasks, such as creating notes, making edits or improvements to existing notes, understanding the current state of an Obsidian vault, and much more.
- When the user initially gives you a task, environment_details will include a list of all files in the current Obsidian folder ('${cwd}'). This file list provides an overview of the vault structure, offering key insights into how knowledge is organized through directory and file names, as well as what file formats are being used. This information can guide your decision-making on which notes might be most relevant to explore further. If you need to explore directories outside the current folder, you can use the list_files tool. If you pass 'true' for the recursive parameter, it will list files recursively. Otherwise, it will list only files at the top level, which is better suited for generic directories where you don't necessarily need the nested structure.${searchInstructions}
`
}

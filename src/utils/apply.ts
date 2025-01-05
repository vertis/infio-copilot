import { TFile } from 'obsidian'

// 替换指定行范围的内容
const replaceLines = (content: string, startLine: number, endLine: number, newContent: string): string => {
	const lines = content.split('\n')
	const beforeLines = lines.slice(0, startLine - 1)
	const afterLines = lines.slice(endLine) // 这里不需要 +1 因为 endLine 指向的是要替换的最后一行
	return [...beforeLines, newContent, ...afterLines].join('\n')
}

export const manualApplyChangesToFile = async (
	content: string,
	currentFile: TFile,
	currentFileContent: string,
	startLine?: number,
	endLine?: number,
): Promise<string | null> => {
	console.log('Manual apply changes to file:', currentFile.path)
	console.log('Start line:', startLine)
	console.log('End line:', endLine)
	console.log('Content:', content)
	try {
		if (!startLine || !endLine) {
			console.error('Missing line numbers for edit')
			return null
		}

		// 直接替换指定行范围的内容
		const newContent = replaceLines(
			currentFileContent,
			startLine,
			endLine,
			content
		)

		return newContent
	} catch (error) {
		console.error('Error applying changes:', error)
		return null
	}
}

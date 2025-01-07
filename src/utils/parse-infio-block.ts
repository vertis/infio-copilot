import { parseFragment } from 'parse5'

export enum InfioBlockAction {
  Edit = 'edit',
  New = 'new',
  Reference = 'reference'
}

export type ParsedInfioBlock =
	| { type: 'string'; content: string }
	| {
		type: 'infio_block'
		content: string
		language?: string
		filename?: string
		startLine?: number
		endLine?: number
		action?: InfioBlockAction
	}

function isInfioBlockAction(value: string): value is InfioBlockAction {
  return Object.values<string>(InfioBlockAction).includes(value)
}

export function parseinfioBlocks(input: string): ParsedInfioBlock[] {
	const parsedResult: ParsedInfioBlock[] = []
	const fragment = parseFragment(input, {
		sourceCodeLocationInfo: true,
	})
	let lastEndOffset = 0
	for (const node of fragment.childNodes) {
		if (node.nodeName === 'infio_block') {
			if (!node.sourceCodeLocation) {
				throw new Error('sourceCodeLocation is undefined')
			}
			const startOffset = node.sourceCodeLocation.startOffset
			const endOffset = node.sourceCodeLocation.endOffset
			if (startOffset > lastEndOffset) {
				parsedResult.push({
					type: 'string',
					content: input.slice(lastEndOffset, startOffset),
				})
			}

			const language = node.attrs.find((attr) => attr.name === 'language')?.value
			const filename = node.attrs.find((attr) => attr.name === 'filename')?.value
			const startLine = node.attrs.find((attr) => attr.name === 'startline')?.value
			const endLine = node.attrs.find((attr) => attr.name === 'endline')?.value
			const actionValue = node.attrs.find((attr) => attr.name === 'type')?.value
			const action = actionValue && isInfioBlockAction(actionValue)
				? actionValue
				: undefined


			const children = node.childNodes
			if (children.length === 0) {
				parsedResult.push({
					type: 'infio_block',
					content: '',
					language,
					filename,
					startLine: startLine ? parseInt(startLine) : undefined,
					endLine: endLine ? parseInt(endLine) : undefined,
					action: action,
				})
			} else {
				const innerContentStartOffset =
					children[0].sourceCodeLocation?.startOffset
				const innerContentEndOffset =
					children[children.length - 1].sourceCodeLocation?.endOffset
				if (!innerContentStartOffset || !innerContentEndOffset) {
					throw new Error('sourceCodeLocation is undefined')
				}
				parsedResult.push({
					type: 'infio_block',
					content: input.slice(innerContentStartOffset, innerContentEndOffset),
					language,
					filename,
					startLine: startLine ? parseInt(startLine) : undefined,
					endLine: endLine ? parseInt(endLine) : undefined,
					action: action,
				})
			}
			lastEndOffset = endOffset
		}
	}
	if (lastEndOffset < input.length) {
		parsedResult.push({
			type: 'string',
			content: input.slice(lastEndOffset),
		})
	}
	return parsedResult
}

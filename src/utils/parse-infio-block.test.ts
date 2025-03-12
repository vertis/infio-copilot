import { InfioBlockAction, ParsedMsgBlock, parseMsgBlocks } from './parse-infio-block'

describe('parseinfioBlocks', () => {
	it('should parse a string with infio_block elements', () => {
		const input = `Some text before
<infio_block language="markdown" filename="example.md">
# Example Markdown

This is a sample markdown content for testing purposes.

## Features

- Lists
- **Bold text**
- *Italic text*
- [Links](https://example.com)

### Code Block
\`\`\`python
print("Hello, world!")
\`\`\`
</infio_block>
Some text after`

		const expected: ParsedMsgBlock[] = [
			{ type: 'string', content: 'Some text before\n' },
			{
				type: 'infio_block',
				content: `
# Example Markdown

This is a sample markdown content for testing purposes.

## Features

- Lists
- **Bold text**
- *Italic text*
- [Links](https://example.com)

### Code Block
\`\`\`python
print("Hello, world!")
\`\`\`
`,
				language: 'markdown',
				filename: 'example.md',
			},
			{ type: 'string', content: '\nSome text after' },
		]

		const result = parseMsgBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should handle empty infio_block elements', () => {
		const input = `
      <infio_block language="python"></infio_block>
    `

		const expected: ParsedMsgBlock[] = [
			{ type: 'string', content: '\n      ' },
			{
				type: 'infio_block',
				content: '',
				language: 'python',
				filename: undefined,
			},
			{ type: 'string', content: '\n    ' },
		]

		const result = parseMsgBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should handle input without infio_block elements', () => {
		const input = 'Just a regular string without any infio_block elements.'

		const expected: ParsedMsgBlock[] = [{ type: 'string', content: input }]

		const result = parseMsgBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should handle multiple infio_block elements', () => {
		const input = `Start
<infio_block language="python" filename="script.py">
def greet(name):
    print(f"Hello, {name}!")
</infio_block>
Middle
<infio_block language="markdown" filename="example.md">
# Using tildes for code blocks

Did you know that you can use tildes for code blocks?

~~~python
print("Hello, world!")
~~~
</infio_block>
End`

		const expected: ParsedMsgBlock[] = [
			{ type: 'string', content: 'Start\n' },
			{
				type: 'infio_block',
				content: `
def greet(name):
    print(f"Hello, {name}!")
`,
				language: 'python',
				filename: 'script.py',
			},
			{ type: 'string', content: '\nMiddle\n' },
			{
				type: 'infio_block',
				content: `
# Using tildes for code blocks

Did you know that you can use tildes for code blocks?

~~~python
print("Hello, world!")
~~~
`,
				language: 'markdown',
				filename: 'example.md',
			},
			{ type: 'string', content: '\nEnd' },
		]

		const result = parseMsgBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should handle unfinished infio_block with only opening tag', () => {
		const input = `Start
<infio_block language="markdown">
# Unfinished infio_block

Some text after without closing tag`
		const expected: ParsedMsgBlock[] = [
			{ type: 'string', content: 'Start\n' },
			{
				type: 'infio_block',
				content: `
# Unfinished infio_block

Some text after without closing tag`,
				language: 'markdown',
				filename: undefined,
			},
		]

		const result = parseMsgBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should handle infio_block with startline and endline attributes', () => {
		const input = `<infio_block language="markdown" startline="2" endline="5"></infio_block>`
		const expected: ParsedMsgBlock[] = [
			{
				type: 'infio_block',
				content: '',
				language: 'markdown',
				startLine: 2,
				endLine: 5,
			},
		]

		const result = parseMsgBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should parse infio_block with action attribute', () => {
		const input = `<infio_block type="edit"></infio_block>`
		const expected: ParsedMsgBlock[] = [
			{
				type: 'infio_block',
				content: '',
				action: InfioBlockAction.Edit,
			},
		]

		const result = parseMsgBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should handle invalid action attribute', () => {
		const input = `<infio_block type="invalid"></infio_block>`
		const expected: ParsedMsgBlock[] = [
			{
				type: 'infio_block',
				content: '',
				action: undefined,
			},
		]

		const result = parseMsgBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should parse a string with think elements', () => {
		const input = `Some text before
<think>
This is a thought that should be parsed separately.
It might contain multiple lines of text.
</think>
Some text after`

		const expected: ParsedMsgBlock[] = [
			{ type: 'string', content: 'Some text before\n' },
			{
				type: 'think',
				content: `
This is a thought that should be parsed separately.
It might contain multiple lines of text.
`
			},
			{ type: 'string', content: '\nSome text after' },
		]

		const result = parseMsgBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should handle empty think elements', () => {
		const input = `
      <think></think>
    `

		const expected: ParsedMsgBlock[] = [
			{ type: 'string', content: '\n      ' },
			{
				type: 'think',
				content: '',
			},
			{ type: 'string', content: '\n    ' },
		]

		const result = parseMsgBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should handle mixed infio_block and think elements', () => {
		const input = `Start
<infio_block language="python" filename="script.py">
def greet(name):
    print(f"Hello, {name}!")
</infio_block>
Middle
<think>
Let me think about this problem...
I need to consider several approaches.
</think>
End`

		const expected: ParsedMsgBlock[] = [
			{ type: 'string', content: 'Start\n' },
			{
				type: 'infio_block',
				content: `
def greet(name):
    print(f"Hello, {name}!")
`,
				language: 'python',
				filename: 'script.py',
			},
			{ type: 'string', content: '\nMiddle\n' },
			{
				type: 'think',
				content: `
Let me think about this problem...
I need to consider several approaches.
`
			},
			{ type: 'string', content: '\nEnd' },
		]

		const result = parseMsgBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should handle unfinished think with only opening tag', () => {
		const input = `Start
<think>
Some unfinished thought
without closing tag`
		const expected: ParsedMsgBlock[] = [
			{ type: 'string', content: 'Start\n' },
			{
				type: 'think',
				content: `
Some unfinished thought
without closing tag`,
			},
		]

		const result = parseMsgBlocks(input)
		expect(result).toEqual(expected)
	})
})

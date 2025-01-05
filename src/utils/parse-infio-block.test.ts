import { ParsedinfioBlock, parseinfioBlocks } from './parse-infio-block'

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

		const expected: ParsedinfioBlock[] = [
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

		const result = parseinfioBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should handle empty infio_block elements', () => {
		const input = `
      <infio_block language="python"></infio_block>
    `

		const expected: ParsedinfioBlock[] = [
			{ type: 'string', content: '\n      ' },
			{
				type: 'infio_block',
				content: '',
				language: 'python',
				filename: undefined,
			},
			{ type: 'string', content: '\n    ' },
		]

		const result = parseinfioBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should handle input without infio_block elements', () => {
		const input = 'Just a regular string without any infio_block elements.'

		const expected: ParsedinfioBlock[] = [{ type: 'string', content: input }]

		const result = parseinfioBlocks(input)
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

		const expected: ParsedinfioBlock[] = [
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

		const result = parseinfioBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should handle unfinished infio_block with only opening tag', () => {
		const input = `Start
<infio_block language="markdown">
# Unfinished infio_block

Some text after without closing tag`
		const expected: ParsedinfioBlock[] = [
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

		const result = parseinfioBlocks(input)
		expect(result).toEqual(expected)
	})

	it('should handle infio_block with startline and endline attributes', () => {
		const input = `<infio_block language="markdown" startline="2" endline="5"></infio_block>`
		const expected: ParsedinfioBlock[] = [
			{
				type: 'infio_block',
				content: '',
				language: 'markdown',
				startLine: 2,
				endLine: 5,
			},
		]

		const result = parseinfioBlocks(input)
		expect(result).toEqual(expected)
	})
})

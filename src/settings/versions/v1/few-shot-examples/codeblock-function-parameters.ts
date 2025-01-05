import Context from "../../../../core/autocomplete/context-detection";
import { FewShotExample } from "../../index";

const messages: FewShotExample = {
	context: Context.CodeBlock,
	input: `\`\`\`python
def fibonacci(<mask/>) -> int:
\tif n == 0 or n == 1:
\t\treturn n
\telse:
\t\treturn fibonacci(n-1) + fibonacci(n-2)
\`\`\`
`,
	answer: `THOUGHT: This function finds the nth Fibonacci number. The 'n' arg of type int is missing. Based on the location of <mask/>, the answer must be function arguments.
LANGUAGE: Python 
ANSWER: n: int`,
};

export default messages;

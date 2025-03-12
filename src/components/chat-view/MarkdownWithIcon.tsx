import { CircleCheckBig, CircleHelp } from 'lucide-react';
import { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const MarkdownWithIcons = ({ markdownContent, className }: { markdownContent: string, className?: string }) => {
	// 预处理markdown内容，将<icon>标签转换为ReactMarkdown可以处理的格式
	const processedContent = markdownContent.replace(
		/<icon\s+name=['"]([^'"]+)['"]\s+size=\{(\d+)\}(\s+className=['"]([^'"]+)['"])?[^>]*\/>/g,
		(_, name, size, __, className) => 
			`<span data-icon="${name}" data-size="${size}" ${className ? `class="${className}"` : ''}></span>`
	);

	const components = {
		span: (props: ComponentPropsWithoutRef<'span'> & {
			'data-icon'?: string;
			'data-size'?: string;
		}) => {
			if (props['data-icon']) {
				const name = props['data-icon'];
				const size = props['data-size'] ? Number(props['data-size']) : 16;
				const className = props.className || '';
				
				switch (name) {
					case 'ask_followup_question':
						return <CircleHelp size={size} className={className} />;
					case 'attempt_completion':
						return <CircleCheckBig size={size} className={className} />;
					default:
						return null;
				}
			}
			return <span {...props} />;
		},
	};

	return (
		<ReactMarkdown 
			className={`${className}`}
			components={components}
			rehypePlugins={[rehypeRaw]}
		>
			{processedContent}
		</ReactMarkdown>
	);
};

export default MarkdownWithIcons;

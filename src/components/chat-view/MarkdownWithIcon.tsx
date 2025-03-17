import * as Tooltip from '@radix-ui/react-tooltip';
import { Check, CircleCheckBig, CircleHelp, CopyIcon, FilePlus2 } from 'lucide-react';
import { ComponentPropsWithoutRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useApp } from 'src/contexts/AppContext';


function CopyButton({ message }: { message: string }) {
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		await navigator.clipboard.writeText(message.trim())
		setCopied(true)
		setTimeout(() => {
			setCopied(false)
		}, 1500)
	}

	return (
		<Tooltip.Provider delayDuration={0}>
			<Tooltip.Root>
				<Tooltip.Trigger asChild>
					<button>
						{copied ? (
							<Check
								size={12}
								className="infio-chat-message-actions-icon--copied"
							/>
						) : (
							<CopyIcon onClick={handleCopy} size={12} />
						)}
					</button>
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content className="infio-tooltip-content">
						Copy message
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</Tooltip.Provider>
	)
}

function CreateNewFileButton({ message }: { message: string }) {
	const app = useApp()
	const [created, setCreated] = useState(false)

	const handleCreate = async () => {
		const firstLine = message.split('\n')[0].trim().replace(/[\\\/:]/g, '');
		const filename = firstLine.slice(0, 200) + (firstLine.length > 200 ? '...' : '') || 'untitled';
		console.log('filename', filename)
		console.log('message', message)
		await app.vault.create(`/${filename}.md`, message)
		setCreated(true)
		setTimeout(() => {
			setCreated(false)
		}, 1500)
	}
	return (
		<Tooltip.Provider delayDuration={0}>
			<Tooltip.Root>
				<Tooltip.Trigger asChild>
					<button style={{ color: '#008000' }}>
						{created ? (
							<Check
								size={12}
								className="infio-chat-message-actions-icon--copied"
							/>
						) : (
								<FilePlus2 onClick={handleCreate} size={12} />
						)}
					</button>
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content className="infio-tooltip-content">
						Create new note
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</Tooltip.Provider>
	)
}

const MarkdownWithIcons = ({ markdownContent, className }: { markdownContent: string, className?: string }) => {
	// 预处理markdown内容，将<icon>标签转换为ReactMarkdown可以处理的格式
	const processedContent = markdownContent.replace(
		/<icon\s+name=['"]([^'"]+)['"]\s+size=\{(\d+)\}(\s+className=['"]([^'"]+)['"])?[^>]*\/>/g,
		(_, name, size, __, className) =>
			`<span data-icon="${name}" data-size="${size}" ${className ? `class="${className}"` : ''}></span>`
	);

	const rawContent = markdownContent.replace(
		/<icon\s+name=['"]([^'"]+)['"]\s+size=\{(\d+)\}(\s+className=['"]([^'"]+)['"])?[^>]*\/>/g,
		() => ``
	).trim();

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
		<>
			<ReactMarkdown
				className={`${className}`}
				components={components}
				rehypePlugins={[rehypeRaw]}
			>
				{processedContent}
			</ReactMarkdown>
			{processedContent &&
				<div className="infio-chat-message-actions">
					<CopyButton message={rawContent} />
					<CreateNewFileButton message={rawContent} />
				</div>}
		</>

	);
};

export default MarkdownWithIcons;

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Fuse, { FuseResult } from 'fuse.js'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useSettings } from '../../../contexts/SettingsContext'
import { ApiProvider } from '../../../types/llm/model'
import { GetAllProviders, GetProviderModelIds } from "../../../utils/api"

type TextSegment = {
	text: string;
	isHighlighted: boolean;
};

type SearchableItem = {
	id: string;
	html: string | TextSegment[];
};

type HighlightedItem = {
	id: string;
	html: TextSegment[];
};

// Reuse highlight function from ProviderModelsPicker
const highlight = (fuseSearchResult: Array<FuseResult<SearchableItem>>): HighlightedItem[] => {
	const set = (obj: Record<string, unknown>, path: string, value: TextSegment[]): void => {
		const pathValue = path.split(".")
		let i: number
		let current = obj as Record<string, unknown>

		for (i = 0; i < pathValue.length - 1; i++) {
			const nextValue = current[pathValue[i]]
			if (typeof nextValue === 'object' && nextValue !== null) {
				current = nextValue as Record<string, unknown>
			} else {
				throw new Error(`Invalid path: ${path}`)
			}
		}

		current[pathValue[i]] = value
	}

	const mergeRegions = (regions: [number, number][]): [number, number][] => {
		if (regions.length === 0) return regions
		regions.sort((a, b) => a[0] - b[0])
		const merged: [number, number][] = [regions[0]]
		for (let i = 1; i < regions.length; i++) {
			const last = merged[merged.length - 1]
			const current = regions[i]
			if (current[0] <= last[1] + 1) {
				last[1] = Math.max(last[1], current[1])
			} else {
				merged.push(current)
			}
		}
		return merged
	}

	const generateHighlightedSegments = (inputText: string, regions: [number, number][] = []): TextSegment[] => {
		if (regions.length === 0) {
			return [{ text: inputText, isHighlighted: false }];
		}

		const mergedRegions = mergeRegions(regions);
		const segments: TextSegment[] = [];
		let nextUnhighlightedRegionStartingIndex = 0;

		mergedRegions.forEach((region) => {
			const start = region[0];
			const end = region[1];
			const lastRegionNextIndex = end + 1;

			if (nextUnhighlightedRegionStartingIndex < start) {
				segments.push({
					text: inputText.substring(nextUnhighlightedRegionStartingIndex, start),
					isHighlighted: false,
				});
			}

			segments.push({
				text: inputText.substring(start, lastRegionNextIndex),
				isHighlighted: true,
			});

			nextUnhighlightedRegionStartingIndex = lastRegionNextIndex;
		});

		if (nextUnhighlightedRegionStartingIndex < inputText.length) {
			segments.push({
				text: inputText.substring(nextUnhighlightedRegionStartingIndex),
				isHighlighted: false,
			});
		}

		return segments;
	}

	return fuseSearchResult
		.filter(({ matches }) => matches && matches.length)
		.map(({ item, matches }): HighlightedItem => {
			const highlightedItem: HighlightedItem = {
				id: item.id,
				html: typeof item.html === 'string' ? [{ text: item.html, isHighlighted: false }] : [...item.html]
			}

			matches?.forEach((match) => {
				if (match.key && typeof match.value === "string" && match.indices) {
					const mergedIndices = mergeRegions([...match.indices])
					set(highlightedItem, match.key, generateHighlightedSegments(match.value, mergedIndices))
				}
			})

			return highlightedItem
		})
}

const HighlightedText: React.FC<{ segments: TextSegment[] }> = ({ segments }) => {
	return (
		<>
			{segments.map((segment, index) => (
				segment.isHighlighted ? (
					<span key={index} className="infio-llm-setting-model-item-highlight">{segment.text}</span>
				) : (
					<span key={index}>{segment.text}</span>
				)
			))}
		</>
	);
};

export function ModelSelect() {
	const { settings, setSettings } = useSettings()
	const [isOpen, setIsOpen] = useState(false)
	const [modelProvider, setModelProvider] = useState(settings.chatModelProvider)
	const [chatModelId, setChatModelId] = useState(settings.chatModelId)
	const [modelIds, setModelIds] = useState<string[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedIndex, setSelectedIndex] = useState(0)

	const providers = GetAllProviders()

	useEffect(() => {
		const fetchModels = async () => {
			setIsLoading(true)
			try {
				const models = await GetProviderModelIds(modelProvider)
				setModelIds(models)
				setChatModelId(settings.chatModelId)
			} catch (error) {
				console.error('Failed to fetch provider models:', error)
				setModelIds([])
			} finally {
				setIsLoading(false)
			}
		}

		fetchModels()
	}, [modelProvider, settings.chatModelId])

	const searchableItems = useMemo(() => {
		return modelIds.map((id) => ({
			id,
			html: id,
		}))
	}, [modelIds])

	const fuse = useMemo(() => {
		return new Fuse<SearchableItem>(searchableItems, {
			keys: ["html"],
			threshold: 0.6,
			shouldSort: true,
			isCaseSensitive: false,
			ignoreLocation: false,
			includeMatches: true,
			minMatchCharLength: 1,
		})
	}, [searchableItems])

	const filteredOptions = useMemo(() => {
		const results: HighlightedItem[] = searchTerm
			? highlight(fuse.search(searchTerm))
			: searchableItems.map(item => ({
				...item,
				html: typeof item.html === 'string' ? [{ text: item.html, isHighlighted: false }] : item.html
			}))
		return results
	}, [searchableItems, searchTerm, fuse])

	return (
		<DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenu.Trigger className="infio-chat-input-model-select">
				<div className="infio-chat-input-model-select__icon">
					{isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
				</div>
				<div className="infio-chat-input-model-select__model-name">
					[{modelProvider}] {chatModelId}
				</div>
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content className="infio-popover infio-llm-setting-combobox-dropdown">
					<div className="infio-llm-setting-search-container">
						<select
							className="infio-llm-setting-provider-switch"
							value={modelProvider}
							onChange={(e) => {
								const newProvider = e.target.value as ApiProvider
								setModelProvider(newProvider)
								setSearchTerm("")
								setSelectedIndex(0)
							}}
						>
							{providers.map((provider) => (
								<option
									key={provider}
									value={provider}
									className={`infio-llm-setting-provider-option ${provider === modelProvider ? 'is-active' : ''}`}
								>
									{provider}
								</option>
							))}
						</select>
						{modelIds.length > 0 ? (
							<input
								type="text"
								className="infio-llm-setting-item-search"
								placeholder="search model..."
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value)
									setSelectedIndex(0)
								}}
								onKeyDown={(e) => {
									switch (e.key) {
										case "ArrowDown":
											e.preventDefault()
											setSelectedIndex((prev) =>
												Math.min(prev + 1, filteredOptions.length - 1)
											)
											break
										case "ArrowUp":
											e.preventDefault()
											setSelectedIndex((prev) => Math.max(prev - 1, 0))
											break
										case "Enter": {
											e.preventDefault()
											const selectedOption = filteredOptions[selectedIndex]
											if (selectedOption) {
												setSettings({
													...settings,
													chatModelProvider: modelProvider,
													chatModelId: selectedOption.id,
												})
												setChatModelId(selectedOption.id)
												setSearchTerm("")
												setIsOpen(false)
											}
											break
										}
										case "Escape":
											e.preventDefault()
											setIsOpen(false)
											setSearchTerm("")
											break
									}
								}}
							/>
						) : (
							<input
								type="text"
								className="infio-llm-setting-item-search"
								placeholder="input custom model name"
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value)
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault()
										setSettings({
											...settings,
											chatModelProvider: modelProvider,
											chatModelId: searchTerm,
										})
										setChatModelId(searchTerm)
										setIsOpen(false)
									}
								}}
							/>
						)}
					</div>
					<ul>
						{isLoading ? (
							<li>Loading...</li>
						) : (
							filteredOptions.map((option, index) => (
								<DropdownMenu.Item
									key={option.id}
									onSelect={() => {
										setSettings({
											...settings,
											chatModelProvider: modelProvider,
											chatModelId: option.id,
										})
										setChatModelId(option.id)
										setSearchTerm("")
										setIsOpen(false)
									}}
									className={`infio-llm-setting-combobox-option ${index === selectedIndex ? 'is-selected' : ''}`}
									onMouseEnter={() => setSelectedIndex(index)}
									asChild
								>
									<li>
										<HighlightedText segments={option.html} />
									</li>
								</DropdownMenu.Item>
							))
						)}
					</ul>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	)
}

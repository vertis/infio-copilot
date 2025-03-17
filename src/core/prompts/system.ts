import {
	CustomModePrompts,
	Mode,
	ModeConfig,
	PromptComponent,
	defaultModeSlug,
	getGroupName,
	getModeBySlug,
	modes
} from "../../utils/modes"
import { DiffStrategy } from "../diff/DiffStrategy"
import { McpHub } from "../mcp/McpHub"

import {
	addCustomInstructions,
	getCapabilitiesSection,
	getMcpServersSection,
	getModesSection,
	getObjectiveSection,
	getRulesSection,
	getSharedToolUseSection,
	getSystemInfoSection,
	getToolUseGuidelinesSection,
} from "./sections"
import { getToolDescriptionsForMode } from "./tools"

async function generatePrompt(
	cwd: string,
	supportsComputerUse: boolean,
	mode: Mode,
	mcpHub?: McpHub,
	diffStrategy?: DiffStrategy,
	browserViewportSize?: string,
	promptComponent?: PromptComponent,
	customModeConfigs?: ModeConfig[],
	globalCustomInstructions?: string,
	preferredLanguage?: string,
	diffEnabled?: boolean,
	experiments?: Record<string, boolean>,
	enableMcpServerCreation?: boolean,
): Promise<string> {
	// if (!context) {
	// 	throw new Error("Extension context is required for generating system prompt")
	// }

	const searchTool = "semantic"

	// If diff is disabled, don't pass the diffStrategy
	const effectiveDiffStrategy = diffEnabled ? diffStrategy : undefined

	// Get the full mode config to ensure we have the role definition
	const modeConfig = getModeBySlug(mode, customModeConfigs) || modes.find((m) => m.slug === mode) || modes[0]
	const roleDefinition = promptComponent?.roleDefinition || modeConfig.roleDefinition

	const [modesSection, mcpServersSection] = await Promise.all([
		getModesSection(),
		modeConfig.groups.some((groupEntry) => getGroupName(groupEntry) === "mcp")
			? getMcpServersSection(mcpHub, effectiveDiffStrategy, enableMcpServerCreation)
			: Promise.resolve(""),
	])

	const basePrompt = `${roleDefinition}

${getSharedToolUseSection()}

${getToolDescriptionsForMode(
		mode,
		cwd,
		searchTool,
		supportsComputerUse,
		effectiveDiffStrategy,
		browserViewportSize,
		mcpHub,
		customModeConfigs,
		experiments,
	)}

${getToolUseGuidelinesSection()}

${mcpServersSection}

${getCapabilitiesSection(
		mode,
		cwd,
		searchTool,
	)}

${modesSection}

${getRulesSection(
		mode,
		cwd,
		searchTool,
		supportsComputerUse,
		effectiveDiffStrategy,
		experiments,
	)}

${getSystemInfoSection(cwd)}

${getObjectiveSection(mode)}

${await addCustomInstructions(promptComponent?.customInstructions || modeConfig.customInstructions || "", globalCustomInstructions || "", cwd, mode, { preferredLanguage })}`

	return basePrompt
}

export const SYSTEM_PROMPT = async (
	cwd: string,
	supportsComputerUse: boolean,
	mode: Mode = defaultModeSlug,
	mcpHub?: McpHub,
	diffStrategy?: DiffStrategy,
	browserViewportSize?: string,
	customModePrompts?: CustomModePrompts,
	customModes?: ModeConfig[],
	globalCustomInstructions?: string,
	preferredLanguage?: string,
	diffEnabled?: boolean,
	experiments?: Record<string, boolean>,
	enableMcpServerCreation?: boolean,
): Promise<string> => {
	// if (!context) {
	// 	throw new Error("Extension context is required for generating system prompt")
	// }

	const getPromptComponent = (value: unknown) => {
		if (typeof value === "object" && value !== null) {
			return value as PromptComponent
		}
		return undefined
	}

	// Try to load custom system prompt from file
	// const fileCustomSystemPrompt = await loadSystemPromptFile(cwd, mode)

	// Check if it's a custom mode
	const promptComponent = getPromptComponent(customModePrompts?.[mode])

	// Get full mode config from custom modes or fall back to built-in modes
	const currentMode = getModeBySlug(mode, customModes) || modes.find((m) => m.slug === mode) || modes[0]

	// If a file-based custom system prompt exists, use it
	// 	if (fileCustomSystemPrompt) {
	// 		const roleDefinition = promptComponent?.roleDefinition || currentMode.roleDefinition
	// 		return `${roleDefinition}

	// ${fileCustomSystemPrompt}

	// ${await addCustomInstructions(promptComponent?.customInstructions || currentMode.customInstructions || "", globalCustomInstructions || "", cwd, mode, { preferredLanguage })}`
	// 	}

	// If diff is disabled, don't pass the diffStrategy
	const effectiveDiffStrategy = diffEnabled ? diffStrategy : undefined

	return generatePrompt(
		// context,
		cwd,
		supportsComputerUse,
		currentMode.slug,
		mcpHub,
		effectiveDiffStrategy,
		browserViewportSize,
		promptComponent,
		customModes,
		globalCustomInstructions,
		preferredLanguage,
		diffEnabled,
		experiments,
		enableMcpServerCreation,
	)
}

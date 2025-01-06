import { z } from 'zod';


import { DEFAULT_MODELS } from '../constants';
import {
	fewShotExampleSchema,
	MAX_DELAY,
	MAX_MAX_CHAR_LIMIT,
	MIN_DELAY,
	MIN_MAX_CHAR_LIMIT,
	modelOptionsSchema
} from '../settings/versions/shared';
import { DEFAULT_AUTOCOMPLETE_SETTINGS } from "../settings/versions/v1/v1";
import { isRegexValid, isValidIgnorePattern } from '../utils/auto-complete';

export const SETTINGS_SCHEMA_VERSION = 0.1

const ollamaModelSchema = z.object({
	baseUrl: z.string().catch(''),
	model: z.string().catch(''),
})

const openAICompatibleModelSchema = z.object({
	baseUrl: z.string().catch(''),
	apiKey: z.string().catch(''),
	model: z.string().catch(''),
})

const ragOptionsSchema = z.object({
	chunkSize: z.number().catch(1000),
	thresholdTokens: z.number().catch(8192),
	minSimilarity: z.number().catch(0.0),
	limit: z.number().catch(10),
	excludePatterns: z.array(z.string()).catch([]),
	includePatterns: z.array(z.string()).catch([]),
})

export const triggerSchema = z.object({
	type: z.enum(['string', 'regex']),
	value: z.string().min(1, { message: "Trigger value must be at least 1 character long" })
}).strict().superRefine((trigger, ctx) => {
	if (trigger.type === "regex") {
		if (!trigger.value.endsWith("$")) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Regex triggers must end with a $.",
				path: ["value"],
			});
		}
		if (!isRegexValid(trigger.value)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `Invalid regex: "${trigger.value}"`,
				path: ["value"],
			});
		}
	}
});

export const InfioSettingsSchema = z.object({
	// Version
	version: z.literal(SETTINGS_SCHEMA_VERSION).catch(SETTINGS_SCHEMA_VERSION),

	// activeModels
	activeModels: z.array(
		z.object({
			name: z.string(),
			provider: z.string(),
			enabled: z.boolean(),
			isEmbeddingModel: z.boolean(),
			isBuiltIn: z.boolean(),
			apiKey: z.string().optional(),
			baseUrl: z.string().optional(),
			dimension: z.number().optional(),
		})
	).catch(DEFAULT_MODELS),

	// API Keys
	infioApiKey: z.string().catch(''),
	openAIApiKey: z.string().catch(''),
	anthropicApiKey: z.string().catch(''),
	geminiApiKey: z.string().catch(''),
	groqApiKey: z.string().catch(''),
	deepseekApiKey: z.string().catch(''),

	// DEFAULT Chat Model
	chatModelId: z.string().catch('deepseek-chat'),
	ollamaChatModel: ollamaModelSchema.catch({
		baseUrl: '',
		model: '',
	}),
	openAICompatibleChatModel: openAICompatibleModelSchema.catch({
		baseUrl: '',
		apiKey: '',
		model: '',
	}),

	// DEFAULT Apply Model
	applyModelId: z.string().catch('deepseek-chat'),
	ollamaApplyModel: ollamaModelSchema.catch({
		baseUrl: '',
		model: '',
	}),
	openAICompatibleApplyModel: openAICompatibleModelSchema.catch({
		baseUrl: '',
		apiKey: '',
		model: '',
	}),

	// DEFAULT Embedding Model
	embeddingModelId: z.string().catch(
		'text-embedding-004',
	),
	ollamaEmbeddingModel: ollamaModelSchema.catch({
		baseUrl: '',
		model: '',
	}),

	// System Prompt
	systemPrompt: z.string().catch(''),

	// RAG Options
	ragOptions: ragOptionsSchema.catch({
		chunkSize: 1000,
		thresholdTokens: 8192,
		minSimilarity: 0.0,
		limit: 10,
		excludePatterns: [],
		includePatterns: [],
	}),

	// autocomplete options
	autocompleteEnabled: z.boolean(),
	advancedMode: z.boolean(),
	apiProvider: z.enum(['azure', 'openai', "ollama"]),
	azureOAIApiSettings: z.string().catch(''),
	openAIApiSettings: z.string().catch(''),
	ollamaApiSettings: z.string().catch(''),
	triggers: z.array(triggerSchema),
	delay: z.number().int().min(MIN_DELAY, { message: "Delay must be between 0ms and 2000ms" }).max(MAX_DELAY, { message: "Delay must be between 0ms and 2000ms" }),
	modelOptions: modelOptionsSchema,
	systemMessage: z.string().min(3, { message: "System message must be at least 3 characters long" }),
	fewShotExamples: z.array(fewShotExampleSchema),
	userMessageTemplate: z.string().min(3, { message: "User message template must be at least 3 characters long" }),
	chainOfThoughRemovalRegex: z.string().refine((regex) => isRegexValid(regex), { message: "Invalid regex" }),
	dontIncludeDataviews: z.boolean(),
	maxPrefixCharLimit: z.number().int().min(MIN_MAX_CHAR_LIMIT, { message: `Max prefix char limit must be at least ${MIN_MAX_CHAR_LIMIT}` }).max(MAX_MAX_CHAR_LIMIT, { message: `Max prefix char limit must be at most ${MAX_MAX_CHAR_LIMIT}` }),
	maxSuffixCharLimit: z.number().int().min(MIN_MAX_CHAR_LIMIT, { message: `Max prefix char limit must be at least ${MIN_MAX_CHAR_LIMIT}` }).max(MAX_MAX_CHAR_LIMIT, { message: `Max prefix char limit must be at most ${MAX_MAX_CHAR_LIMIT}` }),
	removeDuplicateMathBlockIndicator: z.boolean(),
	removeDuplicateCodeBlockIndicator: z.boolean(),
	ignoredFilePatterns: z.string().refine((value) => value
		.split("\n")
		.filter(s => s.trim().length > 0)
		.filter(s => !isValidIgnorePattern(s)).length === 0,
		{ message: "Invalid ignore pattern" }
	),
	ignoredTags: z.string().refine((value) => value
		.split("\n")
		.filter(s => s.includes(" ")).length === 0, { message: "Tags cannot contain spaces" }
	).refine((value) => value
		.split("\n")
		.filter(s => s.includes("#")).length === 0, { message: "Enter tags without the # symbol" }
	).refine((value) => value
		.split("\n")
		.filter(s => s.includes(",")).length === 0, { message: "Enter each tag on a new line without commas" }
	),
	cacheSuggestions: z.boolean(),
	debugMode: z.boolean(),
})

export type InfioSettings = z.infer<typeof InfioSettingsSchema>

type Migration = {
	fromVersion: number
	toVersion: number
	migrate: (data: Record<string, unknown>) => Record<string, unknown>
}

const MIGRATIONS: Migration[] = [
	{
		fromVersion: 0,
		toVersion: 1,
		migrate: (data) => {
			const newData = { ...data }
			if (
				'ollamaBaseUrl' in newData &&
				typeof newData.ollamaBaseUrl === 'string'
			) {
				newData.ollamaChatModel = {
					baseUrl: newData.ollamaBaseUrl,
					model: '',
				}
				newData.ollamaApplyModel = {
					baseUrl: newData.ollamaBaseUrl,
					model: '',
				}
				newData.ollamaEmbeddingModel = {
					baseUrl: newData.ollamaBaseUrl,
					model: '',
				}
				delete newData.ollamaBaseUrl
			}

			return newData
		},
	},
]

function migrateSettings(
	data: Record<string, unknown>,
): Record<string, unknown> {
	let currentData = { ...data }
	const currentVersion = (currentData.version as number) ?? 0

	for (const migration of MIGRATIONS) {
		if (
			currentVersion >= migration.fromVersion &&
			currentVersion < migration.toVersion &&
			migration.toVersion <= SETTINGS_SCHEMA_VERSION
		) {
			console.log(
				`Migrating settings from ${migration.fromVersion} to ${migration.toVersion}`,
			)
			currentData = migration.migrate(currentData)
		}
	}

	return currentData
}

export function parseInfioSettings(data: unknown): InfioSettings {
	try {
		const migratedData = migrateSettings(data as Record<string, unknown>)
		return InfioSettingsSchema.parse(migratedData)
	} catch (error) {
		console.warn('Invalid settings provided, using defaults:', error)
		return InfioSettingsSchema.parse({ ...DEFAULT_AUTOCOMPLETE_SETTINGS })
	}
}

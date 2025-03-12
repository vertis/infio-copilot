import { DiffStrategy } from "../../diff/DiffStrategy"
import { McpHub } from "../../mcp/McpHub"

export type ToolArgs = {
	cwd: string
	searchTool?: string,
	supportsComputerUse: boolean
	diffStrategy?: DiffStrategy
	browserViewportSize?: string
	mcpHub?: McpHub
	toolOptions?: any
}

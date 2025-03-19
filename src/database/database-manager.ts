// @ts-expect-error
import { type PGliteWithLive } from '@electric-sql/pglite/live'
import { App } from 'obsidian'

// import { PGLITE_DB_PATH } from '../constants'
import { createAndInitDb } from '../pgworker'

import { ConversationManager } from './modules/conversation/conversation-manager'
import { TemplateManager } from './modules/template/template-manager'
import { VectorManager } from './modules/vector/vector-manager'
// import { pgliteResources } from './pglite-resources'
// import { migrations } from './sql'

export class DBManager {
	// private app: App
	// private dbPath: string
	private db: PGliteWithLive | null = null
	// private db: PgliteDatabase | null = null
	private vectorManager: VectorManager
	private templateManager: TemplateManager
	private conversationManager: ConversationManager

	constructor(app: App) {
		this.app = app
		// this.dbPath = dbPath
	}

	static async create(app: App): Promise<DBManager> {
		const dbManager = new DBManager(app)
		dbManager.db = await createAndInitDb()

		dbManager.vectorManager = new VectorManager(app, dbManager)
		dbManager.templateManager = new TemplateManager(app, dbManager)
		dbManager.conversationManager = new ConversationManager(app, dbManager)

		return dbManager
	}

	getPgClient() {
		return this.db
	}

	getVectorManager() {
		return this.vectorManager
	}

	getTemplateManager() {
		return this.templateManager
	}

	getConversationManager() {
		return this.conversationManager
	}

	// private async createNewDatabase() {
	// 	const { fsBundle, wasmModule, vectorExtensionBundlePath } =
	// 		await this.loadPGliteResources()
	// 	this.db = await PGlite.create({
	// 		fsBundle: fsBundle,
	// 		wasmModule: wasmModule,
	// 		extensions: {
	// 			vector: vectorExtensionBundlePath,
	// 			live,
	// 		},
	// 	})
	// }

	// private async loadExistingDatabase() {
	// 	try {
	// 		const databaseFileExists = await this.app.vault.adapter.exists(
	// 			this.dbPath,
	// 		)
	// 		if (!databaseFileExists) {
	// 			return null
	// 		}
	// 		const fileBuffer = await this.app.vault.adapter.readBinary(this.dbPath)
	// 		const fileBlob = new Blob([fileBuffer], { type: 'application/x-gzip' })
	// 		const { fsBundle, wasmModule, vectorExtensionBundlePath } =
	// 			await this.loadPGliteResources()
	// 		this.db = await PGlite.create({
	// 			loadDataDir: fileBlob,
	// 			fsBundle: fsBundle,
	// 			wasmModule: wasmModule,
	// 			extensions: {
	// 				vector: vectorExtensionBundlePath,
	// 				live
	// 			},
	// 		})
	// 		// return drizzle(this.pgClient)
	// 	} catch (error) {
	// 		console.error('Error loading database:', error)
	// 		console.log(this.dbPath)
	// 		return null
	// 	}
	// }

	// private async migrateDatabase(): Promise<void> {
	// 	if (!this.db) {
	// 		throw new Error('Database client not initialized');
	// 	}

	// 	try {
	// 		// Execute SQL migrations
	// 		for (const [_key, migration] of Object.entries(migrations)) {
	// 			// Split SQL into individual commands and execute them one by one
	// 			const commands = migration.sql.split('\n\n').filter(cmd => cmd.trim());
	// 			for (const command of commands) {
	// 				await this.db.query(command);
	// 			}
	// 		}
	// 	} catch (error) {
	// 		console.error('Error executing SQL migrations:', error);
	// 		throw error;
	// 	}
	// }

	async save(): Promise<void> {
		console.log("need remove")
	}

	async cleanup() {
		this.db?.close()
		this.db = null
	}

	// private async loadPGliteResources(): Promise<{
	// 	fsBundle: Blob
	// 	wasmModule: WebAssembly.Module
	// 	vectorExtensionBundlePath: URL
	// }> {
	// 	try {
	// 		// Convert base64 to binary data
	// 		const wasmBinary = Buffer.from(pgliteResources.wasmBase64, 'base64')
	// 		const dataBinary = Buffer.from(pgliteResources.dataBase64, 'base64')
	// 		const vectorBinary = Buffer.from(pgliteResources.vectorBase64, 'base64')

	// 		// Create blobs from binary data
	// 		const fsBundle = new Blob([dataBinary], {
	// 			type: 'application/octet-stream',
	// 		})
	// 		const wasmModule = await WebAssembly.compile(wasmBinary)

	// 		// Create a blob URL for the vector extension
	// 		const vectorBlob = new Blob([vectorBinary], {
	// 			type: 'application/gzip',
	// 		})
	// 		const vectorExtensionBundlePath = URL.createObjectURL(vectorBlob)

	// 		return {
	// 			fsBundle,
	// 			wasmModule,
	// 			vectorExtensionBundlePath: new URL(vectorExtensionBundlePath),
	// 		}
	// 	} catch (error) {
	// 		console.error('Error loading PGlite resources:', error)
	// 		throw error
	// 	}
	// }
}

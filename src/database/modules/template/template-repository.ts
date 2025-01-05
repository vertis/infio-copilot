import { PGliteInterface } from '@electric-sql/pglite'
import { App } from 'obsidian'

import { DatabaseNotInitializedException } from '../../exception'
import { type InsertTemplate, type SelectTemplate } from '../../schema'

export class TemplateRepository {
	private app: App
	private db: PGliteInterface | null

	constructor(app: App, pgClient: PGliteInterface | null) {
		this.app = app
		this.db = pgClient
	}

	async create(template: InsertTemplate): Promise<SelectTemplate> {
		if (!this.db) {
			throw new DatabaseNotInitializedException()
		}

		const result = await this.db.query<SelectTemplate>(
			`INSERT INTO "template" (name, content)
       VALUES ($1, $2)
       RETURNING *`,
			[template.name, template.content]
		)
		return result.rows[0]
	}

	async findAll(): Promise<SelectTemplate[]> {
		if (!this.db) {
			throw new DatabaseNotInitializedException()
		}
		const result = await this.db.query<SelectTemplate>(
			`SELECT * FROM "template"`
		)
		return result.rows
	}

	async findByName(name: string): Promise<SelectTemplate | null> {
		if (!this.db) {
			throw new DatabaseNotInitializedException()
		}
		const result = await this.db.query<SelectTemplate>(
			`SELECT * FROM "template" WHERE name = $1`,
			[name]
		)
		return result.rows[0] ?? null
	}

	async update(
		id: string,
		template: Partial<InsertTemplate>,
	): Promise<SelectTemplate | null> {
		if (!this.db) {
			throw new DatabaseNotInitializedException()
		}

		const setClauses: string[] = []
		const params: any[] = []
		let paramIndex = 1

		if (template.name !== undefined) {
			setClauses.push(`name = $${paramIndex}`)
			params.push(template.name)
			paramIndex++
		}

		if (template.content !== undefined) {
			setClauses.push(`content = $${paramIndex}`)
			params.push(template.content)
			paramIndex++
		}

		setClauses.push(`updated_at = now()`)
		params.push(id)

		const result = await this.db.query<SelectTemplate>(
			`UPDATE "template"
       SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
			params
		)
		return result.rows[0] ?? null
	}

	async delete(id: string): Promise<boolean> {
		if (!this.db) {
			throw new DatabaseNotInitializedException()
		}
		const result = await this.db.query<SelectTemplate>(
			`DELETE FROM "template" WHERE id = $1 RETURNING *`,
			[id]
		)
		return result.rows.length > 0
	}
}

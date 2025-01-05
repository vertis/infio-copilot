import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
} from 'react'

import { DBManager } from '../database/database-manager'
import { TemplateManager } from '../database/modules/template/template-manager'
import { VectorManager } from '../database/modules/vector/vector-manager'

type DatabaseContextType = {
	getDatabaseManager: () => Promise<DBManager>
	getVectorManager: () => Promise<VectorManager>
	getTemplateManager: () => Promise<TemplateManager>
}

const DatabaseContext = createContext<DatabaseContextType | null>(null)

export function DatabaseProvider({
	children,
	getDatabaseManager,
}: {
	children: React.ReactNode
	getDatabaseManager: () => Promise<DBManager>
}) {
	const getVectorManager = useCallback(async () => {
		return (await getDatabaseManager()).getVectorManager()
	}, [getDatabaseManager])

	const getTemplateManager = useCallback(async () => {
		return (await getDatabaseManager()).getTemplateManager()
	}, [getDatabaseManager])

	useEffect(() => {
		// start initialization of dbManager in the background
		void getDatabaseManager()
	}, [getDatabaseManager])

	const value = useMemo(() => {
		return { getDatabaseManager, getVectorManager, getTemplateManager }
	}, [getDatabaseManager, getVectorManager, getTemplateManager])

	return (
		<DatabaseContext.Provider value={value}>
			{children}
		</DatabaseContext.Provider>
	)
}

export function useDatabase(): DatabaseContextType {
	const context = useContext(DatabaseContext)
	if (!context) {
		throw new Error('useDatabase must be used within a DatabaseProvider')
	}
	return context
}

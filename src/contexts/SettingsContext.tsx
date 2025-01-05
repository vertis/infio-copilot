import React, { useEffect, useMemo, useState } from 'react'

import { InfioSettings } from '../types/settings'

type SettingsContextType = {
  settings: InfioSettings
  setSettings: (newSettings: InfioSettings) => void
}

// Settings context
const SettingsContext = React.createContext<SettingsContextType | undefined>(
  undefined,
)

export const SettingsProvider = ({
  children,
  settings: initialSettings,
  setSettings,
  addSettingsChangeListener,
}: {
  children: React.ReactNode
  settings: InfioSettings
  setSettings: (newSettings: InfioSettings) => void
  addSettingsChangeListener: (
    listener: (newSettings: InfioSettings) => void,
  ) => () => void
}) => {
  const [settingsCached, setSettingsCached] = useState(initialSettings)

  useEffect(() => {
    const removeListener = addSettingsChangeListener((newSettings) => {
      setSettingsCached(newSettings)
    })

    return () => {
      removeListener()
    }
  }, [addSettingsChangeListener, setSettings])

  const value = useMemo(
    () => ({ settings: settingsCached, setSettings }),
    [settingsCached, setSettings],
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const settings = React.useContext(SettingsContext)
  if (!settings) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return settings
}

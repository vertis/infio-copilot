import React, { createContext, useContext } from 'react'

const DialogContext = createContext<HTMLElement | null>(null)

export function DialogProvider({
  children,
  container,
}: {
  children: React.ReactNode
  container: HTMLElement | null
}) {
  return (
    <DialogContext.Provider value={container}>
      {children}
    </DialogContext.Provider>
  )
}

export function useDialogContainer() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error(
      'useDialogContainer must be used within a DialogContainerProvider',
    )
  }
  return context
}

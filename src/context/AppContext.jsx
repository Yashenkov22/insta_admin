import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

export function AppProvider({ children }) {
  const [showNewAccModal, setShowNewAccModal] = useState(false)

  const openNewAccountModal  = () => setShowNewAccModal(true)
  const closeNewAccountModal = () => setShowNewAccModal(false)

  return (
    <AppContext.Provider value={{
      showNewAccModal, openNewAccountModal, closeNewAccountModal,
    }}>
      {children}
    </AppContext.Provider>
  )
}

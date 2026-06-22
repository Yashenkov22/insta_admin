import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { AppProvider, useApp } from './context/AppContext'
import { AppShell } from './components/Layout/AppShell'
import { LoginScreen } from './components/LoginScreen'
import { ModalNewAccount } from './components/modals/ModalNewAccount'
import { IconSpinner } from './components/Icons'
import { tokenStorage, verifySession } from './utils/auth'

import { AccountsPage } from './pages/AccountsPage'
import { AccountDetailPage } from './pages/AccountDetailPage'
import { AllThreadsPage } from './pages/AllThreadsPage'
import { ThreadsPage } from './pages/ThreadsPage'
import { MessagesPage } from './pages/MessagesPage'
import { MessageDetailPage } from './pages/MessageDetailPage'
import { AllMessagesPage } from './pages/AllMessagesPage'

function InnerApp({ authed, onLogin, onLogout }) {
  const { showNewAccModal, closeNewAccountModal } = useApp()

  useEffect(() => {
    const handler = () => onLogout()
    window.addEventListener('app:logout', handler)
    return () => window.removeEventListener('app:logout', handler)
  }, [onLogout])

  if (!authed) return <LoginScreen onLogin={onLogin} />

  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/accounts" replace />} />

          {/* accounts tree */}
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/accounts/:accountSeg" element={<AccountDetailPage />} />
          <Route path="/accounts/:accountSeg/threads" element={<ThreadsPage />} />
          <Route path="/accounts/:accountSeg/threads/:threadSeg" element={<MessagesPage />} />
          <Route path="/accounts/:accountSeg/threads/:threadSeg/:messageSeg" element={<MessageDetailPage />} />

          {/* threads tree */}
          <Route path="/threads" element={<AllThreadsPage />} />
          <Route path="/threads/:threadSeg" element={<MessagesPage />} />
          <Route path="/threads/:threadSeg/:messageSeg" element={<MessageDetailPage />} />

          {/* messages tree */}
          <Route path="/messages" element={<AllMessagesPage />} />
          <Route path="/messages/:messageSeg" element={<MessageDetailPage />} />
          <Route path="/messages/:messageSeg/:threadSeg" element={<MessagesPage />} />
          <Route path="/messages/:messageSeg/:threadSeg/:messageSeg2" element={<MessageDetailPage />} />

          <Route path="*" element={<Navigate to="/accounts" replace />} />
        </Routes>
      </AppShell>

      {showNewAccModal && (
        <ModalNewAccount
          onClose={closeNewAccountModal}
          onCreated={() => {
            closeNewAccountModal()
            window.dispatchEvent(new CustomEvent('app:account-created'))
          }}
        />
      )}
    </>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(null)

  useEffect(() => {
    verifySession().then((ok) => {
      if (!ok) tokenStorage.clear()
      setAuthed(ok)
    })
  }, [])

  if (authed === null) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)', gap: 12,
        color: 'var(--text-muted)', fontSize: 12,
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        <IconSpinner size={20} /> Checking session…
      </div>
    )
  }

  return (
    <AppProvider>
      <InnerApp
        authed={authed}
        onLogin={() => setAuthed(true)}
        onLogout={() => { tokenStorage.clear(); setAuthed(false) }}
      />
    </AppProvider>
  )
}

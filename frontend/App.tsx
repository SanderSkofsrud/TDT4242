import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PrivacyProvider } from './context/PrivacyContext'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { AppRouter } from './router'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <PrivacyProvider>
            <AppRouter />
          </PrivacyProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

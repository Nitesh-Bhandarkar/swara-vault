import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RagaListPage from './pages/RagaListPage'
import RagaDetailPage from './pages/RagaDetailPage'
import RagaFormPage from './pages/RagaFormPage'
import ImportPage from './pages/ImportPage'
import { getMe } from './api/auth'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: () => getMe().then(r => r.data),
  })

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: '#0D0A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(201,168,76,0.6)', fontSize: '2rem', gap: '0.5rem' }}>
      <span className="note-float">♩</span>
      <span className="note-float-2">♪</span>
      <span className="note-float-3">♫</span>
    </div>
  )
  if (isError || !data) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<ProtectedRoute><RagaListPage /></ProtectedRoute>} />
          <Route path="/ragas/new" element={<ProtectedRoute><RagaFormPage /></ProtectedRoute>} />
          <Route path="/ragas/:id" element={<ProtectedRoute><RagaDetailPage /></ProtectedRoute>} />
          <Route path="/ragas/:id/edit" element={<ProtectedRoute><RagaFormPage /></ProtectedRoute>} />
          <Route path="/import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

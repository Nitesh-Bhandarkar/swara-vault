import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RagaListPage from './pages/RagaListPage'
import RagaDetailPage from './pages/RagaDetailPage'
import RagaFormPage from './pages/RagaFormPage'
import ImportPage from './pages/ImportPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RagaListPage />} />
          <Route path="/ragas/new" element={<RagaFormPage />} />
          <Route path="/ragas/:id" element={<RagaDetailPage />} />
          <Route path="/ragas/:id/edit" element={<RagaFormPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router/dom'
import { isBackendUp, setApiMocked } from '@/api/client'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/query-client'
import { router } from '@/router'
import './index.css'

/**
 * Démarre le mock MSW du contrat avant le premier appel API :
 * toujours avec `dev:mock`, et en `dev` dès que le back ne répond pas.
 * Conditions écrites en littéral pour que le build de prod élimine MSW.
 */
async function enableMocking() {
  if (import.meta.env.MODE !== 'mock' && import.meta.env.VITE_API_MOCK !== 'true') {
    if (!import.meta.env.DEV || (await isBackendUp())) return
    console.warn('[mock] Back injoignable : les données sont simulées par MSW (src/mocks).')
  }

  const { network } = await import('./mocks/browser')
  network.enable()
  setApiMocked()
}

enableMocking().then(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors />
      </QueryClientProvider>
    </StrictMode>,
  ),
)

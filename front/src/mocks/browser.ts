import { FetchInterceptor } from '@mswjs/interceptors/fetch'
import { defineNetwork, InterceptorSource } from 'msw/experimental'
import { handlers } from './handlers'

/**
 * Intercepte `fetch` directement dans la page (pas de service worker à enregistrer)
 * et répond avec les handlers du contrat. Les appels mockés n'apparaissent donc
 * pas dans l'onglet Réseau des DevTools.
 */
export const network = defineNetwork({
  sources: [new InterceptorSource({ interceptors: [new FetchInterceptor()] })],
  handlers,
  onUnhandledFrame: 'bypass',
})

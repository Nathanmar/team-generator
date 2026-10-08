/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  /** `true` : les appels API sont servis par le mock MSW (src/mocks) au lieu du back. */
  readonly VITE_API_MOCK?: string
}

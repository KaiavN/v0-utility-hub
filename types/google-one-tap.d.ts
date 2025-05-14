export interface CredentialResponse {
  credential: string
  select_by: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (
            callback?: (notification: {
              isNotDisplayed: () => boolean
              isSkippedMoment: () => boolean
              getNotDisplayedReason: () => string
              getSkippedReason: () => string
            }) => void,
          ) => void
          renderButton: (element: HTMLElement, options: any) => void
        }
      }
    }
  }
}

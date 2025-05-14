export interface CredentialResponse {
  credential: string
  select_by: string
  client_id: string
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (callback?: (notification: any) => void) => void
          renderButton: (parent: HTMLElement, options: any) => void
          disableAutoSelect: () => void
          storeCredential: (credential: any, callback: () => void) => void
          cancel: () => void
          onGoogleLibraryLoad: () => void
          revoke: (hint: string, callback: (done: any) => void) => void
        }
      }
    }
  }
}

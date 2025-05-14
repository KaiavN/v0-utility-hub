export interface CredentialResponse {
  credential: string
  select_by: string
}

export interface GsiButtonConfiguration {
  type: "standard" | "icon"
  theme?: "outline" | "filled_blue" | "filled_black"
  size?: "large" | "medium" | "small"
  text?: "signin_with" | "signup_with" | "continue_with" | "signin"
  shape?: "rectangular" | "pill" | "circle" | "square"
  logo_alignment?: "left" | "center"
  width?: string
  locale?: string
}

export interface GsiButtonConfiguration {
  type: "standard" | "icon"
  theme?: "outline" | "filled_blue" | "filled_black"
  size?: "large" | "medium" | "small"
  text?: "signin_with" | "signup_with" | "continue_with" | "signin"
  shape?: "rectangular" | "pill" | "circle" | "square"
  logo_alignment?: "left" | "center"
  width?: string
  locale?: string
}

export interface PromptMomentNotification {
  isDisplayMoment: () => boolean
  isDisplayed: () => boolean
  isNotDisplayed: () => boolean
  getNotDisplayedReason: () =>
    | "browser_not_supported"
    | "invalid_client"
    | "missing_client_id"
    | "opt_out_or_no_session"
    | "secure_http_required"
    | "suppressed_by_user"
    | "unregistered_origin"
    | "unknown_reason"
  isSkippedMoment: () => boolean
  getSkippedReason: () => "auto_cancel" | "user_cancel" | "tap_outside" | "issuing_failed"
  isDismissedMoment: () => boolean
  getDismissedReason: () => "credential_returned" | "cancel_called" | "flow_restarted"
  getMomentType: () => "display" | "skipped" | "dismissed"
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (input: {
            client_id: string
            callback: (response: CredentialResponse) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
            prompt_parent_id?: string
            nonce?: string
            context?: string
            state_cookie_domain?: string
            ux_mode?: "popup" | "redirect"
            login_uri?: string
            native_callback?: (...args: any[]) => void
            itp_support?: boolean
            use_fedcm_for_prompt?: boolean
          }) => void
          prompt: (momentListener?: (notification: PromptMomentNotification) => void) => void
          renderButton: (parent: HTMLElement, options: GsiButtonConfiguration) => void
          disableAutoSelect: () => void
          storeCredential: (credential: { id: string; password: string }, callback: () => void) => void
          cancel: () => void
          onGoogleLibraryLoad: () => void
          revoke: (accessToken: string, callback: () => void) => void
        }
      }
    }
  }
}

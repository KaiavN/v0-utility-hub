// Define contact-related types

// BookUser type that was missing
export interface BookUser {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
}

// Extended contact type
export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  address: string
  company: string
  avatar: string
  notes: string
  favorite: boolean
  createdAt?: string
  updatedAt?: string
}

// Contact group type
export interface ContactGroup {
  letter: string
  contacts: Contact[]
}

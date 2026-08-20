import { apiRequest, csrfHeaders, jsonBody } from './api'

export type SavedAddress = {
  id: string
  label: string | null
  firstName: string
  lastName: string
  phone: string
  line1: string
  line2: string | null
  city: string
  region: string
  postalCode: string | null
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type AddressInput = {
  label?: string
  firstName: string
  lastName: string
  phone: string
  line1: string
  line2?: string
  city: string
  region: string
  postalCode?: string
  country: string
  isDefault?: boolean
}

export function fetchAddresses() {
  return apiRequest<{ items: SavedAddress[] }>('/addresses')
}

export function createAddress(input: AddressInput) {
  const request = jsonBody(input)
  return apiRequest<SavedAddress>('/addresses', {
    method: 'POST',
    ...request,
    headers: { ...csrfHeaders(), ...request.headers },
  })
}

export function updateAddress(addressId: string, input: AddressInput) {
  const request = jsonBody(input)
  return apiRequest<SavedAddress>(`/addresses/${encodeURIComponent(addressId)}`, {
    method: 'PATCH',
    ...request,
    headers: { ...csrfHeaders(), ...request.headers },
  })
}

export function removeAddress(addressId: string) {
  return apiRequest<void>(`/addresses/${encodeURIComponent(addressId)}`, {
    method: 'DELETE', headers: csrfHeaders(),
  })
}

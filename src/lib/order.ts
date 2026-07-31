// A frontend-only receipt contract; backend order data will replace this later.
export const LAST_ORDER_STORAGE_KEY = 'lumi-last-order'

export type DemoOrder = {
  orderNumber: string
  placedAt: string
  customerName: string
  email: string
  deliveryAddress: string
  estimatedDelivery: string
  paymentMethod: string
  items: Array<{
    id: string
    name: string
    image: string
    quantity: number
    price: number
  }>
  subtotal: number
  shipping: number
  total: number
}

import { BadRequestException, NotFoundException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import type { PrismaService } from '../database/prisma.service.js'
import { AddressesService } from './addresses.service.js'

const userId = '22922b6f-32ab-43e8-9929-51472e9c9325'
const addressId = '3c91c2f1-0bc5-4bed-a78e-544fa342a7d0'
const input = {
  label: 'Home', firstName: 'Amara', lastName: 'Okafor', phone: '+2348012345678',
  line1: '18 Kingsway', city: 'Lagos', region: 'Lagos', country: 'NG',
}

function setup(overrides: Record<string, unknown> = {}) {
  const address = {
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    findFirst: vi.fn().mockResolvedValue({ id: addressId, isDefault: false }),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: addressId, ...data })),
    update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: addressId, ...data })),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    delete: vi.fn().mockResolvedValue({ id: addressId }),
    ...overrides,
  }
  const prisma = {
    address,
    $transaction: vi.fn().mockImplementation((operation) => operation({ address })),
  }
  return { address, service: new AddressesService(prisma as unknown as PrismaService) }
}

describe('AddressesService', () => {
  it('lists only addresses owned by the authenticated customer', async () => {
    const { address, service } = setup()
    await service.list(userId)
    expect(address.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId } }))
  })

  it('automatically makes the first saved address the default', async () => {
    const { address, service } = setup()
    await service.create(userId, input)
    expect(address.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId, isDefault: true }),
    }))
  })

  it('limits each account to ten saved addresses', async () => {
    const { service } = setup({ count: vi.fn().mockResolvedValue(10) })
    await expect(service.create(userId, input)).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rejects updates when the address is not owned by the customer', async () => {
    const { address, service } = setup({ findFirst: vi.fn().mockResolvedValue(null) })
    await expect(service.update(userId, addressId, input)).rejects.toBeInstanceOf(NotFoundException)
    expect(address.update).not.toHaveBeenCalled()
  })

  it('clears the previous default when a customer selects a new one', async () => {
    const { address, service } = setup()
    await service.update(userId, addressId, { ...input, isDefault: true })
    expect(address.updateMany).toHaveBeenCalledWith({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    })
    expect(address.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isDefault: true }) }))
  })

  it('promotes the oldest remaining address after deleting the default', async () => {
    const replacementId = '39aef938-3dbc-42f4-9805-03cc2e15c25b'
    const findFirst = vi.fn()
      .mockResolvedValueOnce({ id: addressId, isDefault: true })
      .mockResolvedValueOnce({ id: replacementId })
    const { address, service } = setup({ findFirst })
    await service.remove(userId, addressId)
    expect(address.delete).toHaveBeenCalledWith({ where: { id: addressId } })
    expect(address.update).toHaveBeenCalledWith({ where: { id: replacementId }, data: { isDefault: true } })
  })
})

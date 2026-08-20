import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service.js'
import type { CreateAddressDto, UpdateAddressDto } from './dto/address.dto.js'

const addressSelect = {
  id: true,
  label: true,
  firstName: true,
  lastName: true,
  phone: true,
  line1: true,
  line2: true,
  city: true,
  region: true,
  postalCode: true,
  country: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} as const

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const items = await this.prisma.address.findMany({
      where: { userId },
      select: addressSelect,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })
    return { items }
  }

  create(userId: string, input: CreateAddressDto) {
    return this.prisma.$transaction(async (transaction) => {
      const count = await transaction.address.count({ where: { userId } })
      if (count >= 10) throw new BadRequestException('You can save up to 10 addresses.')

      const isDefault = count === 0 || input.isDefault === true
      if (isDefault) {
        await transaction.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } })
      }
      const { isDefault: _requestedDefault, ...address } = input
      return transaction.address.create({
        data: { ...address, userId, isDefault },
        select: addressSelect,
      })
    })
  }

  update(userId: string, addressId: string, input: UpdateAddressDto) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.address.findFirst({
        where: { id: addressId, userId },
        select: { id: true, isDefault: true },
      })
      if (!existing) throw new NotFoundException('Address not found')

      if (input.isDefault === true) {
        await transaction.address.updateMany({
          where: { userId, isDefault: true, id: { not: addressId } },
          data: { isDefault: false },
        })
      }
      const { isDefault: requestedDefault, ...address } = input
      return transaction.address.update({
        where: { id: existing.id },
        data: { ...address, ...(requestedDefault === true ? { isDefault: true } : {}) },
        select: addressSelect,
      })
    })
  }

  remove(userId: string, addressId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.address.findFirst({
        where: { id: addressId, userId },
        select: { id: true, isDefault: true },
      })
      if (!existing) throw new NotFoundException('Address not found')

      await transaction.address.delete({ where: { id: existing.id } })
      if (existing.isDefault) {
        const replacement = await transaction.address.findFirst({
          where: { userId },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        })
        if (replacement) {
          await transaction.address.update({ where: { id: replacement.id }, data: { isDefault: true } })
        }
      }
    })
  }
}

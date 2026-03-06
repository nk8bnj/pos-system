import { z } from 'zod'

export const ProductCreateSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  cost: z.number().positive(),
  stock: z.number().int().min(0),
  description: z.string().optional(),
  photoUrl: z.string().optional(),
})

export const ProductUpdateSchema = ProductCreateSchema.partial()

export const InventoryUpdateSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().positive(),
})

export const SaleCreateSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int(),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
      })
    )
    .min(1),
})

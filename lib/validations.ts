import { z } from 'zod'

export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
})

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const ProductCreateSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  cost: z.number().positive(),
  stock: z.number().int().min(0),
  description: z.string().optional(),
  photoUrl: z.string().optional(),
})

export const ProductUpdateSchema = ProductCreateSchema.partial()

export function productPayloadFromFormData(formData: FormData) {
  const optionalString = (key: string) => {
    const value = formData.get(key)
    return typeof value === 'string' && value.trim() ? value : undefined
  }

  return {
    name: formData.get('name'),
    price: Number(formData.get('price')),
    cost: Number(formData.get('cost')),
    stock: Number(formData.get('stock')),
    description: optionalString('description'),
    photoUrl: optionalString('photoUrl'),
  }
}

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

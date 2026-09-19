import { afterEach, describe, expect, it, vi } from 'vitest'
import { getProductImagePath, uploadProductImage } from '@/lib/product-images'

describe('product image storage helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('extracts a path only from the configured product-images bucket', () => {
    vi.stubEnv('SUPABASE_URL', 'https://project.supabase.co')

    expect(
      getProductImagePath(
        'https://project.supabase.co/storage/v1/object/public/product-images/folder/photo.webp'
      )
    ).toBe('folder/photo.webp')
    expect(
      getProductImagePath(
        'https://other.supabase.co/storage/v1/object/public/product-images/photo.webp'
      )
    ).toBeNull()
    expect(
      getProductImagePath(
        'https://project.supabase.co/storage/v1/object/public/other-bucket/photo.webp'
      )
    ).toBeNull()
  })

  it('rejects unsupported files before contacting storage', async () => {
    const file = new File(['not an image'], 'photo.gif', { type: 'image/gif' })

    await expect(uploadProductImage(file)).rejects.toThrow(
      'Дозволені лише JPEG, PNG та WebP зображення'
    )
  })
})

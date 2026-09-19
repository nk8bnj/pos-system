import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const PRODUCT_IMAGES_BUCKET = 'product-images'
const MAX_INPUT_SIZE = 10 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 1200
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function getStorageClient() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase Storage is not configured')
  }

  return createClient(url, serviceRoleKey)
}

export async function uploadProductImage(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Дозволені лише JPEG, PNG та WebP зображення')
  }

  if (file.size > MAX_INPUT_SIZE) {
    throw new Error('Фото має бути не більше 10 MB')
  }

  let optimized: Buffer
  try {
    optimized = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 78 })
      .toBuffer()
  } catch {
    throw new Error('Не вдалося обробити зображення')
  }

  const filename = `${crypto.randomUUID()}.webp`
  const supabase = getStorageClient()
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filename, optimized, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

export function getProductImagePath(url: string | null | undefined) {
  if (!url || !process.env.SUPABASE_URL) return null

  try {
    const imageUrl = new URL(url)
    const supabaseUrl = new URL(process.env.SUPABASE_URL)
    const prefix = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`

    if (imageUrl.origin !== supabaseUrl.origin || !imageUrl.pathname.startsWith(prefix)) {
      return null
    }

    const path = decodeURIComponent(imageUrl.pathname.slice(prefix.length))
    return path || null
  } catch {
    return null
  }
}

export async function deleteProductImage(url: string | null | undefined) {
  const path = getProductImagePath(url)
  if (!path) return

  const { error } = await getStorageClient().storage.from(PRODUCT_IMAGES_BUCKET).remove([path])
  if (error) throw new Error(error.message)
}

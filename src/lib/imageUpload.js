import { supabase } from './supabaseClient'

const IMAGE_MIME_TYPE = /^image\//
const DEFAULT_BUCKET = 'product-images'

export const resolveImageUrl = (value, bucket = DEFAULT_BUCKET) => {
  const image = String(value || '').trim()
  if (!image) return ''
  if (/^https?:\/\//i.test(image)) return image

  const storagePath = image.replace(/^\/+/, '').replace(new RegExp(`^${bucket}/`), '').trim()
  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl
}

export const uploadImageFile = async (file, folder = 'taxonomy', bucket = DEFAULT_BUCKET) => {
  if (!file) return ''
  if (!IMAGE_MIME_TYPE.test(file.type || '')) {
    throw new Error('Unsupported image file.')
  }

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error

  const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  if (!publicUrl) throw new Error('Could not create public image URL.')
  return publicUrl
}

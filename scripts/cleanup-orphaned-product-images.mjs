import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'

const shouldDelete = process.argv.includes('--delete')
const bucket = 'product-images'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

try {
  const { rows } = await pool.query(`
    WITH referenced AS (
      SELECT DISTINCT split_part("photoUrl", '/product-images/', 2) AS name
      FROM public."Product"
      WHERE "photoUrl" IS NOT NULL
    )
    SELECT objects.name, COALESCE((objects.metadata->>'size')::bigint, 0) AS size
    FROM storage.objects AS objects
    LEFT JOIN referenced USING (name)
    WHERE objects.bucket_id = $1 AND referenced.name IS NULL
    ORDER BY objects.created_at
  `, [bucket])

  const totalBytes = rows.reduce((total, file) => total + Number(file.size), 0)
  console.log(`Orphaned files: ${rows.length}`)
  console.log(`Recoverable space: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)

  if (!shouldDelete || rows.length === 0) {
    console.log(shouldDelete ? 'Nothing to delete.' : 'Dry run only. Pass --delete to remove these files.')
    process.exitCode = 0
  } else {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase Storage is not configured')
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    let deleted = 0
    for (let index = 0; index < rows.length; index += 100) {
      const paths = rows.slice(index, index + 100).map((file) => file.name)
      const { data, error } = await supabase.storage.from(bucket).remove(paths)
      if (error) throw error
      deleted += data.length
    }

    console.log(`Deleted files: ${deleted}`)
  }
} finally {
  await pool.end()
}

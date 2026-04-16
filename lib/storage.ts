import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const storageType = process.env.STORAGE_TYPE || 'local'

let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.OCI_REGION!,
      endpoint: process.env.OCI_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.OCI_ACCESS_KEY!,
        secretAccessKey: process.env.OCI_SECRET_KEY!,
      },
      forcePathStyle: true,
    })
  }
  return s3Client
}

export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (storageType === 's3') {
    const client = getS3Client()
    const bucket = process.env.OCI_BUCKET!
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    )
    return `${process.env.OCI_ENDPOINT}/${bucket}/${key}`
  }

  // Local storage fallback
  const uploadDir = join(process.cwd(), 'public', 'uploads', key.split('/')[0])
  await mkdir(uploadDir, { recursive: true })
  const filePath = join(process.cwd(), 'public', 'uploads', key)
  await writeFile(filePath, buffer)
  return `/uploads/${key}`
}

export async function deleteFile(key: string): Promise<void> {
  if (storageType === 's3') {
    const client = getS3Client()
    await client.send(
      new DeleteObjectCommand({ Bucket: process.env.OCI_BUCKET!, Key: key })
    )
    return
  }

  // Local storage fallback
  try {
    const { unlink } = await import('fs/promises')
    await unlink(join(process.cwd(), 'public', 'uploads', key))
  } catch {
    // Ignore if file doesn't exist
  }
}

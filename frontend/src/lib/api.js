// Small fetch wrapper for the Timar API. Errors carry the server's message, error code and field.
export class ApiError extends Error {
  constructor(message, { status, code, field, fields } = {}) {
    super(message)
    this.status = status
    this.code = code
    this.field = field
    this.fields = fields ?? {}
  }
}

export async function api(method, path, body) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Could not reach Timar. Check your connection and try again.', { code: 'network' })
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const e = data.error ?? {}
    throw new ApiError(e.message || 'Something went wrong. Please try again.', { status: res.status, code: e.code, field: e.field, fields: e.fields })
  }
  return data
}

export const get = (path) => api('GET', path)

// Reads an image file into a data URL and uploads it; resolves to the stored URL.
export function uploadImage(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new ApiError('Use a JPG, PNG or WebP image.'))
    if (file.size > 2 * 1024 * 1024) return reject(new ApiError('Please use an image under 2 MB.'))
    const reader = new FileReader()
    reader.onload = () => api('POST', '/uploads', { data: reader.result }).then((r) => resolve(r.url), reject)
    reader.onerror = () => reject(new ApiError('Could not read that file.'))
    reader.readAsDataURL(file)
  })
}

export const formatDate = (iso, opts = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', opts)

// Article bodies are plain text: blank lines split paragraphs, "## " starts a subheading.
export function parseBody(body) {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block) => {
      const lines = block.split('\n')
      if (lines[0].startsWith('## ')) {
        const rest = lines.slice(1).join(' ').trim()
        return [{ type: 'h', text: lines[0].slice(3).trim() }, ...(rest ? [{ type: 'p', text: rest }] : [])]
      }
      return [{ type: 'p', text: lines.join(' ') }]
    })
}

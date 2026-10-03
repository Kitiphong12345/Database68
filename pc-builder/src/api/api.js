const baseURL = import.meta.env.VITE_API_URL || '/api'

async function request(method, path, body, options = {}) {
  const response = await fetch(`${baseURL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  let data = null
  try { data = await response.json() } catch {}
  if (!response.ok) {
    const error = new Error(data?.message || `HTTP ${response.status}`)
    error.response = { status: response.status, data }
    throw error
  }
  return { data, status: response.status }
}

export default {
  get: (path, options) => request('GET', path, undefined, options),
  post: (path, body, options) => request('POST', path, body, options),
  put: (path, body, options) => request('PUT', path, body, options),
  delete: (path, options) => request('DELETE', path, undefined, options)
}

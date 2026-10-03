import crypto from 'crypto'

const sessions = new Map()
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export function loginAdmin(username, password) {
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) return null
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, { username, createdAt: Date.now() })
  return { token, username }
}

export function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || !sessions.has(token)) return res.status(401).json({ message: 'ต้องเข้าสู่ระบบ Admin ก่อน' })
  req.admin = sessions.get(token)
  next()
}

export function logoutAdmin(req) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  sessions.delete(token)
}

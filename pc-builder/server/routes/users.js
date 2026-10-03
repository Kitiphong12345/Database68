import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
const router = Router()

// Demo registration endpoint. Add session/JWT authentication and rate limiting before production use.
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password || String(password).length < 8) {
      return res.status(400).json({ message: 'กรอก username, email และ password อย่างน้อย 8 ตัวอักษร' })
    }
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length) return res.status(409).json({ message: 'อีเมลนี้ถูกใช้แล้ว' })
    const password_hash = await bcrypt.hash(password, 12)
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, password_hash, 'user']
    )
    res.status(201).json({ id: result.insertId, username, email, role: 'user' })
  } catch (err) { next(err) }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const [rows] = await db.execute('SELECT id, username, email, password_hash, role FROM users WHERE email = ?', [email || ''])
    if (!rows.length || !(await bcrypt.compare(password || '', rows[0].password_hash))) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
    }
    // This demo verifies credentials only; no persistent login token is issued yet.
    const { password_hash, ...user } = rows[0]
    res.json({ user, message: 'เข้าสู่ระบบสำเร็จ (ตัวอย่าง API)' })
  } catch (err) { next(err) }
})

export default router

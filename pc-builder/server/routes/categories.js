import { Router } from 'express'
import db from '../db.js'
const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, name, icon FROM categories ORDER BY id')
    res.json(rows)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { id, name, icon } = req.body
    if (!id || !name) return res.status(400).json({ message: 'ต้องระบุ id และ name' })
    await db.execute('INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)', [id, name, icon || null])
    res.status(201).json({ message: 'เพิ่ม Category แล้ว', id })
  } catch (err) { next(err) }
})

export default router

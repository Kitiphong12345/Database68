import { Router } from 'express'
import db from '../db.js'
const router = Router()

// GET /api/products?category=cpu
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query
    const [rows] = category
      ? await db.execute('SELECT * FROM products WHERE category_id = ? ORDER BY name', [category])
      : await db.query('SELECT * FROM products ORDER BY category_id, name')
    res.json(rows.map(row => ({
      ...row,
      id: String(row.id),
      category: row.category_id,
      price: Number(row.price),
      rating: row.rating == null ? null : Number(row.rating),
      watts: row.watts == null ? null : Number(row.watts)
    })))
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'ไม่พบสินค้า' })
    res.json(rows[0])
  } catch (err) { next(err) }
})

// For a class project this endpoint demonstrates product CRUD. Add admin authentication before deployment.
router.post('/', async (req, res, next) => {
  try {
    const p = req.body
    if (!p.id || !p.category || !p.name || !Number.isFinite(Number(p.price))) {
      return res.status(400).json({ message: 'ต้องระบุ id, category, name และ price' })
    }
    await db.execute(
      `INSERT INTO products (id, category_id, brand, name, price, rating, socket, watts, tier, specs, color, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [String(p.id), p.category, p.brand ?? null, p.name, Number(p.price), p.rating ?? null,
       p.socket ?? null, p.watts ?? null, p.tier ?? null, p.specs ?? null, p.color ?? null, p.image_url ?? p.image ?? null]
    )
    res.status(201).json({ message: 'เพิ่มสินค้าแล้ว', id: String(p.id) })
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const p = req.body
    const [result] = await db.execute(
      `UPDATE products SET category_id=?, brand=?, name=?, price=?, rating=?, socket=?, watts=?, tier=?, specs=?, color=?, image_url=? WHERE id=?`,
      [p.category, p.brand ?? null, p.name, Number(p.price), p.rating ?? null, p.socket ?? null,
       p.watts ?? null, p.tier ?? null, p.specs ?? null, p.color ?? null, p.image_url ?? p.image ?? null, req.params.id]
    )
    if (!result.affectedRows) return res.status(404).json({ message: 'ไม่พบสินค้า' })
    res.json({ message: 'แก้ไขสินค้าแล้ว' })
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.execute('DELETE FROM products WHERE id = ?', [req.params.id])
    if (!result.affectedRows) return res.status(404).json({ message: 'ไม่พบสินค้า' })
    res.json({ message: 'ลบสินค้าแล้ว' })
  } catch (err) { next(err) }
})

export default router

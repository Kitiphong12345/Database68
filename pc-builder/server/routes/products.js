import { Router } from 'express'
import db from '../db.js'
import { requireAdmin } from '../auth.js'
const router = Router()

function mapProduct(row) {
  return {
    ...row,
    id: String(row.id),
    category: row.category_id,
    price: Number(row.price),
    previous_price: row.previous_price == null ? null : Number(row.previous_price),
    rating: row.rating == null ? null : Number(row.rating),
    watts: row.watts == null ? null : Number(row.watts)
  }
}

router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query
    const [rows] = category
      ? await db.execute('SELECT * FROM products WHERE category_id = ? ORDER BY name', [category])
      : await db.query('SELECT * FROM products ORDER BY category_id, name')
    res.json(rows.map(mapProduct))
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ message: 'ไม่พบสินค้า' })
    res.json(mapProduct(rows[0]))
  } catch (err) { next(err) }
})

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const p = req.body
    if (!p.id || !p.category || !p.name || !Number.isFinite(Number(p.price))) return res.status(400).json({ message: 'ต้องระบุ id, category, name และ price' })
    await db.execute(
      `INSERT INTO products (id, category_id, brand, name, price, previous_price, rating, socket, watts, tier, specs, color, image_url, change_note)
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [String(p.id), p.category, p.brand ?? null, p.name, Number(p.price), p.rating ?? null,
       p.socket ?? null, p.watts ?? null, p.tier ?? null, p.specs ?? null, p.color ?? null,
       p.image_url ?? p.image ?? null, p.change_note ?? null]
    )
    res.status(201).json({ message: 'เพิ่มสินค้าแล้ว', id: String(p.id) })
  } catch (err) { next(err) }
})

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const p = req.body
    if (!p.category || !p.name || !Number.isFinite(Number(p.price))) return res.status(400).json({ message: 'ต้องระบุ category, name และ price' })
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()
      const [currentRows] = await connection.execute('SELECT price FROM products WHERE id = ? FOR UPDATE', [req.params.id])
      if (!currentRows.length) { await connection.rollback(); connection.release(); return res.status(404).json({ message: 'ไม่พบสินค้า' }) }
      const oldPrice = Number(currentRows[0].price)
      const newPrice = Number(p.price)
      const previousPrice = oldPrice !== newPrice ? oldPrice : null
      const [result] = await connection.execute(
        `UPDATE products SET category_id=?, brand=?, name=?, price=?, previous_price=?, rating=?, socket=?, watts=?, tier=?, specs=?, color=?, image_url=?, change_note=? WHERE id=?`,
        [p.category, p.brand ?? null, p.name, newPrice, previousPrice, p.rating ?? null, p.socket ?? null, p.watts ?? null,
         p.tier ?? null, p.specs ?? null, p.color ?? null, p.image_url ?? p.image ?? null, p.change_note ?? null, req.params.id]
      )
      await connection.commit()
      if (!result.affectedRows) return res.status(404).json({ message: 'ไม่พบสินค้า' })
      res.json({ message: 'แก้ไขสินค้าแล้ว', previous_price: previousPrice })
    } catch (err) { await connection.rollback(); throw err } finally { connection.release() }
  } catch (err) { next(err) }
})

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const [result] = await db.execute('DELETE FROM products WHERE id = ?', [req.params.id])
    if (!result.affectedRows) return res.status(404).json({ message: 'ไม่พบสินค้า' })
    res.json({ message: 'ลบสินค้าแล้ว' })
  } catch (err) { next(err) }
})

export default router

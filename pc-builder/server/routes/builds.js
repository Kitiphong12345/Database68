import { Router } from 'express'
import db from '../db.js'
const router = Router()

// Demo endpoints accept user_id; protect these with authentication before production use.
router.get('/', async (req, res, next) => {
  try {
    const userId = Number(req.query.user_id)
    if (!userId) return res.status(400).json({ message: 'ต้องระบุ user_id' })
    const [builds] = await db.execute('SELECT * FROM saved_builds WHERE user_id = ? ORDER BY created_at DESC', [userId])
    for (const build of builds) {
      const [items] = await db.execute(
        `SELECT bi.product_id, bi.quantity, p.name, p.price, p.category_id AS category
         FROM build_items bi JOIN products p ON p.id = bi.product_id WHERE bi.build_id = ?`, [build.id]
      )
      build.items = items
    }
    res.json(builds)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  const connection = await db.getConnection()
  try {
    const { user_id, name, items = [] } = req.body
    if (!Number(user_id) || !name || !Array.isArray(items)) {
      return res.status(400).json({ message: 'ต้องระบุ user_id, name และ items' })
    }
    await connection.beginTransaction()
    const validItems = []
    let total = 0
    for (const item of items) {
      const productId = String(item.product_id ?? item.id ?? '')
      const quantity = Math.max(1, Number(item.quantity || 1))
      const [products] = await connection.execute('SELECT id, price FROM products WHERE id = ?', [productId])
      if (!products.length) throw new Error(`ไม่พบสินค้า ${productId}`)
      total += Number(products[0].price) * quantity
      validItems.push([productId, quantity])
    }
    const [result] = await connection.execute(
      'INSERT INTO saved_builds (user_id, name, total_price) VALUES (?, ?, ?)', [Number(user_id), name, total]
    )
    for (const [productId, quantity] of validItems) {
      await connection.execute('INSERT INTO build_items (build_id, product_id, quantity) VALUES (?, ?, ?)', [result.insertId, productId, quantity])
    }
    await connection.commit()
    res.status(201).json({ id: result.insertId, name, total_price: total, message: 'บันทึกสเปคแล้ว' })
  } catch (err) {
    await connection.rollback()
    if (err.message?.startsWith('ไม่พบสินค้า')) return res.status(400).json({ message: err.message })
    next(err)
  } finally { connection.release() }
})

export default router

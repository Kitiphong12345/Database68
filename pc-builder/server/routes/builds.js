import express from 'express'
import db from '../db.js'

const router = express.Router()

// ดูสเปคที่บันทึกไว้
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM saved_builds
      ORDER BY id DESC
    `)

    res.json(rows)
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'โหลดสเปคไม่สำเร็จ'
    })
  }
})

// บันทึกสเปค
router.post('/', async (req, res) => {
  const connection = await db.getConnection()

  try {
    const {
      user_id,
      name,
      total_price,
      products
    } = req.body

    await connection.beginTransaction()

    const [build] = await connection.query(
      `INSERT INTO saved_builds
      (user_id, name, total_price)
      VALUES (?, ?, ?)`,
      [
        user_id || null,
        name,
        total_price
      ]
    )

    for (const product of products || []) {
      await connection.query(
        `INSERT INTO build_items
        (build_id, product_id, quantity)
        VALUES (?, ?, ?)`,
        [
          build.insertId,
          product.product_id,
          product.quantity || 1
        ]
      )
    }

    await connection.commit()

    res.status(201).json({
      id: build.insertId,
      message: 'บันทึกสเปคเรียบร้อย'
    })
  } catch (error) {
    await connection.rollback()

    console.error(error)

    res.status(500).json({
      message: 'บันทึกสเปคไม่สำเร็จ'
    })
  } finally {
    connection.release()
  }
})

export default router
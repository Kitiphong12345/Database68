import express from 'express'
import db from '../db.js'

const router = express.Router()

// ดูสินค้าทั้งหมด
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM products
      ORDER BY id DESC
    `)

    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'ไม่สามารถโหลดสินค้าได้'
    })
  }
})

// ดูสินค้าตาม ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'ไม่พบสินค้า'
      })
    }

    res.json(rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'เกิดข้อผิดพลาด'
    })
  }
})

// เพิ่มสินค้า
router.post('/', async (req, res) => {
  try {
    const {
      name,
      category,
      brand,
      price,
      image,
      description
    } = req.body

    const [result] = await db.query(
      `INSERT INTO products
      (name, category, brand, price, image, description)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        category,
        brand,
        price,
        image,
        description
      ]
    )

    res.status(201).json({
      id: result.insertId,
      message: 'เพิ่มสินค้าเรียบร้อย'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'เพิ่มสินค้าไม่สำเร็จ'
    })
  }
})

// แก้ไขสินค้า
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      category,
      brand,
      price,
      image,
      description
    } = req.body

    await db.query(
      `UPDATE products
       SET name = ?,
           category = ?,
           brand = ?,
           price = ?,
           image = ?,
           description = ?
       WHERE id = ?`,
      [
        name,
        category,
        brand,
        price,
        image,
        description,
        req.params.id
      ]
    )

    res.json({
      message: 'แก้ไขสินค้าเรียบร้อย'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'แก้ไขสินค้าไม่สำเร็จ'
    })
  }
})

// ลบสินค้า
router.delete('/:id', async (req, res) => {
  try {
    await db.query(
      'DELETE FROM products WHERE id = ?',
      [req.params.id]
    )

    res.json({
      message: 'ลบสินค้าเรียบร้อย'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'ลบสินค้าไม่สำเร็จ'
    })
  }
})

export default router
import express from 'express'
import db from '../db.js'

const router = express.Router()

// สมัครสมาชิก
router.post('/register', async (req, res) => {
  try {
    const {
      username,
      email,
      password
    } = req.body

    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )

    if (existing.length > 0) {
      return res.status(400).json({
        message: 'อีเมลนี้ถูกใช้งานแล้ว'
      })
    }

    const [result] = await db.query(
      `INSERT INTO users
      (username, email, password, role)
      VALUES (?, ?, ?, 'user')`,
      [
        username,
        email,
        password
      ]
    )

    res.status(201).json({
      id: result.insertId,
      message: 'สมัครสมาชิกสำเร็จ'
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'สมัครสมาชิกไม่สำเร็จ'
    })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body

    const [users] = await db.query(
      `SELECT id, username, email, role
       FROM users
       WHERE email = ?
       AND password = ?`,
      [
        email,
        password
      ]
    )

    if (users.length === 0) {
      return res.status(401).json({
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      })
    }

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: users[0]
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'เข้าสู่ระบบไม่สำเร็จ'
    })
  }
})

export default router
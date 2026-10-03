import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import productsRouter from './routes/products.js'
import usersRouter from './routes/users.js'
import buildsRouter from './routes/builds.js'

const app = express()
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))
app.get('/', (_req, res) => res.json({ message: 'PC Builder API is running' }))
app.use('/api/products', productsRouter)
app.use('/api/users', usersRouter)
app.use('/api/builds', buildsRouter)
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
})

const port = Number(process.env.PORT || 3000)
app.listen(port, () => console.log(`API running at http://localhost:${port}`))

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import productsRouter from './routes/products.js'
import usersRouter from './routes/users.js'
import buildsRouter from './routes/builds.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'PC Builder API is running'
  })
})

app.use('/api/products', productsRouter)
app.use('/api/users', usersRouter)
app.use('/api/builds', buildsRouter)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
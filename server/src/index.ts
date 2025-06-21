import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import postRoutes from './routes/post.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/', (req, res) => {
  res.send('✅ 서버 실행 중')
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)

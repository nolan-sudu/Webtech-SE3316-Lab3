import express from 'express'
import cors from 'cors'
import { init } from './db.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: Date.now() })
})

const PORT = process.env.PORT || 3000
init().then(() => {
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))
}).catch(err => {
  console.error('DB init failed', err)
  process.exit(1)
})
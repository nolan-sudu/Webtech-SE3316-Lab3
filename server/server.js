import express from 'express'
import cors from 'cors'
import { init, db } from './db.js'
import { body, validationResult } from 'express-validator'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: Date.now() })
})

app.get('/api/courses', async (req, res) => {
  await db.read()
  res.json(db.data.courses)
})

app.post(
  '/api/courses',
  body('code').isString().trim().notEmpty(),
  body('name').isString().trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    await db.read()
    const newCourse = {
      id: Date.now(),
      code: req.body.code,
      name: req.body.name
    }
    db.data.courses.push(newCourse)
    await db.write()
    res.status(201).json(newCourse)
  }
)

app.delete('/api/courses/:id', async (req, res) => {
  await db.read()
  const id = parseInt(req.params.id)
  const index = db.data.courses.findIndex(c => c.id === id)
  if (index === -1) {
    return res.status(404).json({ error: 'Course not found' })
  }
  db.data.courses.splice(index, 1)
  await db.write()
  res.json({ ok: true })
})

app.get('/', (req, res) => {
  res.send('✅ API server is running.')
})

const PORT = process.env.PORT || 3000
console.log('🔧 Initializing database and starting server...')

init()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))
  })
  .catch(err => {
    console.error('DB init failed', err)
    process.exit(1)
  })
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
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    await db.read()
    if (db.data.courses.some(c => c.code === req.body.code)) {
      return res.status(400).json({ error: 'Course code already exists' })
    }

    const newCourse = { id: Date.now(), code: req.body.code, name: req.body.name, members: [] }
    db.data.courses.push(newCourse)
    await db.write()
    res.status(201).json(newCourse)
  }
)

// 🔹 GET members
app.get('/api/courses/:id/members', async (req, res) => {
  await db.read()
  const course = db.data.courses.find(c => c.id == req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  res.json(course.members || [])
})

// 🔹 ADD member
app.post(
  '/api/courses/:id/members',
  body('name').isString().trim().notEmpty(),
  body('role').isIn(['student', 'ta', 'instructor']),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    await db.read()
    const course = db.data.courses.find(c => c.id == req.params.id)
    if (!course) return res.status(404).json({ error: 'Course not found' })

    const { name, role } = req.body
    if (course.members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: 'Member already exists in course' })
    }

    const member = { id: Date.now(), name, role }
    course.members.push(member)
    await db.write()
    res.status(201).json(member)
  }
)

// 🔹 DELETE member
app.delete('/api/courses/:id/members/:memberId', async (req, res) => {
  await db.read()
  const course = db.data.courses.find(c => c.id == req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  const idx = course.members.findIndex(m => m.id == req.params.memberId)
  if (idx === -1) return res.status(404).json({ error: 'Member not found' })
  course.members.splice(idx, 1)
  await db.write()
  res.json({ ok: true })
})

const PORT = process.env.PORT || 3000
await init()
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))
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

app.get('/api/courses/:id/members', async (req, res) => {
  await db.read()
  const course = db.data.courses.find(c => c.id == req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  res.json(course.members || [])
})

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

app.get('/api/courses/:courseId/sheets', async (req, res) => {
  await db.read()
  const sheets = db.data.sheets.filter(s => s.courseId == req.params.courseId)
  res.json(sheets)
})

app.post(
  '/api/courses/:courseId/sheets',
  body('name').isString().trim().notEmpty(),
  body('description').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    await db.read()
    const course = db.data.courses.find(c => c.id == req.params.courseId)
    if (!course) return res.status(404).json({ error: 'Course not found' })

    const newSheet = {
      id: db.data.nextSheetId++,
      courseId: course.id,
      name: req.body.name,
      description: req.body.description || '',
      slots: []
    }

    db.data.sheets.push(newSheet)
    await db.write()
    res.status(201).json(newSheet)
  }
)

app.delete('/api/sheets/:id', async (req, res) => {
  await db.read()
  const idx = db.data.sheets.findIndex(s => s.id == req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Sheet not found' })
  db.data.sheets.splice(idx, 1)
  await db.write()
  res.json({ ok: true })
})

app.post(
  '/api/slots/:slotId/signup',
  body('memberId').isInt(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    await db.read()

    const sheet = db.data.sheets.find(s => s.slots.some(sl => sl.id == req.params.slotId))
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' })

    const slot = sheet.slots.find(sl => sl.id == req.params.slotId)
    if (!slot) return res.status(404).json({ error: 'Slot not found' })

    const course = db.data.courses.find(c => c.id == sheet.courseId)
    if (!course) return res.status(404).json({ error: 'Course not found' })

    const member = course.members.find(m => m.id == req.body.memberId)
    if (!member) return res.status(400).json({ error: 'Invalid member for this course' })

    if (slot.signups.includes(member.id))
      return res.status(400).json({ error: 'Already signed up' })

    if (slot.signups.length >= slot.capacity)
      return res.status(400).json({ error: 'Slot full' })

    slot.signups.push(member.id)
    await db.write()
    res.status(201).json({ ok: true, slot })
  }
)

app.delete('/api/slots/:slotId/signup/:memberId', async (req, res) => {
  await db.read()

  const sheet = db.data.sheets.find(s => s.slots.some(sl => sl.id == req.params.slotId))
  if (!sheet) return res.status(404).json({ error: 'Sheet not found' })

  const slot = sheet.slots.find(sl => sl.id == req.params.slotId)
  if (!slot) return res.status(404).json({ error: 'Slot not found' })

  const memberId = parseInt(req.params.memberId)
  const index = slot.signups.indexOf(memberId)
  if (index === -1) return res.status(404).json({ error: 'Member not signed up' })

  slot.signups.splice(index, 1)
  await db.write()
  res.json({ ok: true, slot })
})

app.get('/api/slots/:slotId/grades', async (req, res) => {
  await db.read()
  const sheet = db.data.sheets.find(s => s.slots.some(sl => sl.id == req.params.slotId))
  if (!sheet) return res.status(404).json({ error: 'Sheet not found' })
  const slot = sheet.slots.find(sl => sl.id == req.params.slotId)
  if (!slot) return res.status(404).json({ error: 'Slot not found' })
  if (!slot.grades) slot.grades = []
  res.json(slot.grades)
})

app.post(
  '/api/slots/:slotId/grades',
  body('memberId').isInt(),
  body('grade').isInt({ min: 0, max: 100 }),
  body('comment').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    await db.read()
    const sheet = db.data.sheets.find(s => s.slots.some(sl => sl.id == req.params.slotId))
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' })
    const slot = sheet.slots.find(sl => sl.id == req.params.slotId)
    if (!slot) return res.status(404).json({ error: 'Slot not found' })
    if (!slot.signups.includes(req.body.memberId))
      return res.status(400).json({ error: 'Member not signed up in this slot' })

    slot.grades ||= []
    const existing = slot.grades.find(g => g.memberId == req.body.memberId)
    if (existing) {
      existing.grade = req.body.grade
      existing.comment = req.body.comment || existing.comment
    } else {
      slot.grades.push({
        memberId: req.body.memberId,
        grade: req.body.grade,
        comment: req.body.comment || ''
      })
    }

    await db.write()
    res.status(201).json({ ok: true, grades: slot.grades })
  }
)

app.delete('/api/slots/:slotId/grades/:memberId', async (req, res) => {
  await db.read()
  const sheet = db.data.sheets.find(s => s.slots.some(sl => sl.id == req.params.slotId))
  if (!sheet) return res.status(404).json({ error: 'Sheet not found' })
  const slot = sheet.slots.find(sl => sl.id == req.params.slotId)
  if (!slot) return res.status(404).json({ error: 'Slot not found' })
  if (!slot.grades) slot.grades = []

  const idx = slot.grades.findIndex(g => g.memberId == req.params.memberId)
  if (idx === -1) return res.status(404).json({ error: 'Grade not found' })
  slot.grades.splice(idx, 1)

  await db.write()
  res.json({ ok: true })
})
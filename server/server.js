import express from "express"
import cors from "cors"
import { initDB, db } from "./db.js"

const app = express()
app.use(cors())
app.use(express.json())

app.get("/api/health", (req, res) => res.json({ ok: true }))

app.get("/api/courses", async (req, res) => {
  await db.read()
  res.json(db.data.courses)
})

app.post("/api/courses", async (req, res) => {
  const { termCode, name, section = 1 } = req.body
  if (!termCode || !name) return res.status(400).json({ error: "Missing fields" })
  await db.read()
  const exists = db.data.courses.find(c => c.termCode === termCode && c.section === section)
  if (exists) return res.status(400).json({ error: "Course already exists" })
  db.data.courses.push({ termCode, name, section, members: [] })
  await db.write()
  res.json({ ok: true })
})

app.delete("/api/courses/:termCode/:section", async (req, res) => {
  const termCode = parseInt(req.params.termCode)
  const section = parseInt(req.params.section)
  await db.read()
  const before = db.data.courses.length
  db.data.courses = db.data.courses.filter(c => !(c.termCode === termCode && c.section === section))
  if (db.data.courses.length === before) return res.status(404).json({ error: "Course not found" })
  await db.write()
  res.json({ ok: true })
})

app.get("/api/courses/:termCode/:section/members", async (req, res) => {
  await db.read()
  const c = db.data.courses.find(c => c.termCode == req.params.termCode && c.section == req.params.section)
  if (!c) return res.status(404).json({ error: "Course not found" })
  res.json(c.members)
})

app.post("/api/courses/:termCode/:section/members", async (req, res) => {
  await db.read()
  const c = db.data.courses.find(c => c.termCode == req.params.termCode && c.section == req.params.section)
  if (!c) return res.status(404).json({ error: "Course not found" })
  const newMembers = []
  const ignored = []
  req.body.forEach(m => {
    if (c.members.find(x => x.id === m.id)) ignored.push(m.id)
    else newMembers.push(m)
  })
  c.members.push(...newMembers)
  await db.write()
  res.json({ added: newMembers.length, ignored })
})

app.post("/api/courses/:termCode/:section/sheets", async (req, res) => {
  await db.read()
  const c = db.data.courses.find(c => c.termCode == req.params.termCode && c.section == req.params.section)
  if (!c) return res.status(404).json({ error: "Course not found" })
  const { name, notBefore, notAfter } = req.body
  const id = db.data.nextSheetId++
  db.data.sheets.push({ id, termCode: c.termCode, section: c.section, name, notBefore, notAfter, slots: [] })
  await db.write()
  res.json({ id })
})

app.get("/api/courses/:termCode/:section/sheets", async (req, res) => {
  await db.read()
  const sheets = db.data.sheets.filter(s => s.termCode == req.params.termCode && s.section == req.params.section)
  res.json(sheets)
})

app.delete("/api/sheets/:id", async (req, res) => {
  const id = parseInt(req.params.id)
  await db.read()
  db.data.sheets = db.data.sheets.filter(s => s.id !== id)
  await db.write()
  res.json({ ok: true })
})

app.post("/api/sheets/:id/slots", async (req, res) => {
  const sheetId = parseInt(req.params.id)
  const { start, slotDuration, numSlots, maxMembers } = req.body
  await db.read()
  const sheet = db.data.sheets.find(s => s.id === sheetId)
  if (!sheet) return res.status(404).json({ error: "Sheet not found" })
  for (let i = 0; i < numSlots; i++) {
    const id = db.data.nextSlotId++
    sheet.slots.push({ id, start, slotDuration, maxMembers, signups: [] })
  }
  await db.write()
  res.json({ ok: true })
})

app.get("/api/sheets/:id/slots", async (req, res) => {
  const id = parseInt(req.params.id)
  await db.read()
  const s = db.data.sheets.find(s => s.id === id)
  if (!s) return res.status(404).json({ error: "Sheet not found" })
  res.json(s.slots)
})

app.post("/api/grades", async (req, res) => {
  const { memberId, sheetId, grade, comment } = req.body
  await db.read()
  const sheet = db.data.sheets.find(s => s.id === sheetId)
  if (!sheet) return res.status(404).json({ error: "Sheet not found" })
  let entry = db.data.grades.find(g => g.memberId === memberId && g.sheetId === sheetId)
  if (entry) {
    const old = entry.grade
    entry.grade = grade
    entry.comment = (entry.comment || "") + " " + comment
    await db.write()
    return res.json({ old })
  } else {
    db.data.grades.push({ memberId, sheetId, grade, comment })
    await db.write()
    res.json({ ok: true })
  }
})

const PORT = process.env.PORT || 3000
initDB().then(() => {
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))
})

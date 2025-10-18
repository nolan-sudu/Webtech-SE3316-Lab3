const api = 'http://localhost:3000/api'
let currentCourse = null
let currentSheet = null

async function addCourse() {
  const termCode = parseInt(document.getElementById('course-code').value)
  const name = document.getElementById('course-name').value.trim()
  const section = parseInt(document.getElementById('course-section').value) || 1
  if (!termCode || !name) return showError('Fill in all course fields')
  const res = await fetch(`${api}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ termCode, name, section })
  })
  if (res.ok) {
    loadCourses()
    clearError()
  } else showError('Error adding course')
}

async function loadCourses() {
  const res = await fetch(`${api}/courses`)
  const data = await res.json()
  const list = document.getElementById('course-list')
  list.innerHTML = ''
  data.forEach(c => {
    const li = document.createElement('li')
    li.textContent = `${c.termCode}-${c.section} — ${c.name}`
    const del = document.createElement('button')
    del.textContent = 'Delete'
    del.onclick = () => deleteCourse(c.termCode, c.section)
    const open = document.createElement('button')
    open.textContent = 'Open'
    open.onclick = () => selectCourse(c)
    li.append(open, del)
    list.append(li)
  })
}

async function deleteCourse(termCode, section) {
  await fetch(`${api}/courses/${termCode}/${section}`, { method: 'DELETE' })
  loadCourses()
}

function selectCourse(c) {
  currentCourse = c
  document.getElementById('member-list').innerHTML = ''
  document.getElementById('sheet-list').innerHTML = ''
  document.getElementById('slot-list').innerHTML = ''
  loadMembers()
  loadSheets()
}

async function addMember() {
  if (!currentCourse) return showError('Select a course first')
  const id = document.getElementById('member-id').value.trim()
  const first = document.getElementById('member-fn').value.trim()
  const last = document.getElementById('member-ln').value.trim()
  const role = document.getElementById('member-role').value
  if (!id || !first || !last) return showError('Fill all member fields')
  const res = await fetch(`${api}/courses/${currentCourse.termCode}/${currentCourse.section}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ id, first, last, role }])
  })
  if (res.ok) {
    loadMembers()
    clearError()
  } else showError('Error adding member')
}

async function loadMembers() {
  const res = await fetch(`${api}/courses/${currentCourse.termCode}/${currentCourse.section}/members`)
  const data = await res.json()
  const list = document.getElementById('member-list')
  list.innerHTML = ''
  data.forEach(m => {
    const li = document.createElement('li')
    li.textContent = `${m.id} — ${m.first} ${m.last} (${m.role})`
    list.append(li)
  })
}

async function addSheet() {
  if (!currentCourse) return showError('Select a course first')
  const name = document.getElementById('sheet-name').value.trim()
  const notBefore = document.getElementById('not-before').value
  const notAfter = document.getElementById('not-after').value
  const res = await fetch(`${api}/courses/${currentCourse.termCode}/${currentCourse.section}/sheets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, notBefore, notAfter })
  })
  if (res.ok) {
    loadSheets()
    clearError()
  } else showError('Error creating sheet')
}

async function loadSheets() {
  const res = await fetch(`${api}/courses/${currentCourse.termCode}/${currentCourse.section}/sheets`)
  const data = await res.json()
  const list = document.getElementById('sheet-list')
  list.innerHTML = ''
  data.forEach(s => {
    const li = document.createElement('li')
    li.textContent = `${s.id}: ${s.name}`
    const open = document.createElement('button')
    open.textContent = 'Open'
    open.onclick = () => selectSheet(s)
    const del = document.createElement('button')
    del.textContent = 'Delete'
    del.onclick = () => deleteSheet(s.id)
    li.append(open, del)
    list.append(li)
  })
}

async function deleteSheet(id) {
  await fetch(`${api}/sheets/${id}`, { method: 'DELETE' })
  loadSheets()
}

function selectSheet(s) {
  currentSheet = s
  loadSlots()
}

async function addSlot() {
  if (!currentSheet) return showError('Select a sheet first')
  const start = document.getElementById('slot-start').value
  const slotDuration = parseInt(document.getElementById('slot-duration').value)
  const numSlots = parseInt(document.getElementById('slot-num').value)
  const maxMembers = parseInt(document.getElementById('slot-max').value)
  const res = await fetch(`${api}/sheets/${currentSheet.id}/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start, slotDuration, numSlots, maxMembers })
  })
  if (res.ok) {
    loadSlots()
    clearError()
  } else showError('Error adding slot')
}

async function loadSlots() {
  const res = await fetch(`${api}/sheets/${currentSheet.id}/slots`)
  const data = await res.json()
  const list = document.getElementById('slot-list')
  list.innerHTML = ''
  data.forEach(sl => {
    const li = document.createElement('li')
    li.textContent = `Slot ${sl.id}: ${sl.start} | Max ${sl.maxMembers}`
    list.append(li)
  })
}

async function addGrade() {
  const memberId = document.getElementById('grade-member-id').value.trim()
  const sheetId = parseInt(document.getElementById('grade-sheet-id').value)
  const grade = parseInt(document.getElementById('grade-value').value)
  const comment = document.getElementById('grade-comment').value.trim()
  const res = await fetch(`${api}/grades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId, sheetId, grade, comment })
  })
  if (!res.ok) showError('Error adding grade')
  else clearError()
}

function showError(msg) {
  document.getElementById('error').textContent = msg
}

function clearError() {
  document.getElementById('error').textContent = ''
}

document.getElementById('add-course-btn').onclick = addCourse
document.getElementById('add-member').onclick = addMember
document.getElementById('add-sheet').onclick = addSheet
document.getElementById('add-slot').onclick = addSlot
document.getElementById('add-grade').onclick = addGrade

loadCourses()

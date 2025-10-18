const api = 'http://localhost:3000/api'
let currentCourse = null
let currentSheet = null

function normalizeCourse(c) {
  const termCode = Number(c.termCode ?? c.term ?? c.code) || 0
  const section = Number(c.section ?? c.sec) || 1
  const name = c.name ?? c.courseName ?? ''
  return { termCode, section, name }
}

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
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return showError(data.error || 'Error adding course')
  clearError()
  currentCourse = { termCode, section, name }
  await loadCourses(true)
}

async function loadCourses(keepSelection = false) {
  const res = await fetch(`${api}/courses`)
  const data = await res.json()
  const list = document.getElementById('course-list')
  list.innerHTML = ''
  data.forEach(raw => {
    const c = normalizeCourse(raw)
    const li = document.createElement('li')
    li.dataset.term = c.termCode
    li.dataset.section = c.section
    const label = document.createElement('span')
    label.textContent = `${c.termCode}-${c.section} — ${c.name}`
    li.appendChild(label)
    const actions = document.createElement('div')
    actions.classList.add('course-actions')
    const selectBtn = document.createElement('button')
    const isSelected = currentCourse && currentCourse.termCode === c.termCode && currentCourse.section === c.section
    selectBtn.textContent = isSelected ? 'Deselect' : 'Select'
    selectBtn.classList.add('open-btn')
    selectBtn.onclick = () => toggleCourseSelection(c)
    const delBtn = document.createElement('button')
    delBtn.textContent = 'Delete'
    delBtn.classList.add('delete-btn')
    delBtn.onclick = async () => deleteCourse(c.termCode, c.section)
    actions.append(selectBtn, delBtn)
    li.append(actions)
    if (isSelected) li.classList.add('selected')
    list.appendChild(li)
  })
  if (keepSelection && currentCourse) {
    updateCourseHighlight()
    loadMembers()
    loadSheets()
  }
}

function updateCourseHighlight() {
  document.querySelectorAll('#course-list li').forEach(li => {
    const term = parseInt(li.dataset.term)
    const sec = parseInt(li.dataset.section)
    if (currentCourse && term === currentCourse.termCode && sec === currentCourse.section)
      li.classList.add('selected')
    else
      li.classList.remove('selected')
  })
}

function toggleCourseSelection(c) {
  if (currentCourse && currentCourse.termCode === c.termCode && currentCourse.section === c.section) {
    currentCourse = null
    currentSheet = null
    document.getElementById('member-list').innerHTML = ''
    document.getElementById('sheet-list').innerHTML = ''
    document.getElementById('slot-list').innerHTML = ''
  } else {
    currentCourse = c
    loadMembers()
    loadSheets()
  }
  updateCourseHighlight()
}

async function deleteCourse(termCode, section) {
  const res = await fetch(`${api}/courses/${termCode}/${section}`, { method: 'DELETE' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return showError(data.error || 'Error deleting course')
  clearError()
  if (currentCourse && currentCourse.termCode === termCode && currentCourse.section === section)
    currentCourse = null
  await loadCourses(true)
}

async function addMember() {
  if (!currentCourse) return showError('Select a course first')
  const id = document.getElementById('member-id').value.trim()
  const first = document.getElementById('member-fn').value.trim()
  const last = document.getElementById('member-ln').value.trim()
  const role = document.getElementById('member-role').value
  if (!id || !first || !last) return showError('Fill all member fields')
  const payload = [{ id: id.slice(0,8), first: first.slice(0,200), last: last.slice(0,200), role: role.slice(0,10) }]
  const res = await fetch(`${api}/courses/${currentCourse.termCode}/${currentCourse.section}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return showError(data.error || 'Error adding member')
  clearError()
  await loadMembers()
  updateCourseHighlight()
}

async function loadMembers() {
  if (!currentCourse) return
  const res = await fetch(`${api}/courses/${currentCourse.termCode}/${currentCourse.section}/members`)
  const data = await res.json()
  const list = document.getElementById('member-list')
  list.innerHTML = ''
  data.forEach(m => {
    const li = document.createElement('li')
    const text = document.createElement('span')
    text.textContent = `${m.id} — ${m.first} ${m.last} (${m.role})`
    li.appendChild(text)
    const actions = document.createElement('div')
    actions.classList.add('member-actions')
    const del = document.createElement('button')
    del.textContent = 'Delete'
    del.onclick = () => deleteMember(m.id)
    actions.appendChild(del)
    li.appendChild(actions)
    list.appendChild(li)
  })
}

async function deleteMember(memberId) {
  if (!currentCourse) return
  const payload = [memberId]
  const res = await fetch(`${api}/courses/${currentCourse.termCode}/${currentCourse.section}/members`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return showError(data.error || 'Error deleting member')
  clearError()
  await loadMembers()
  updateCourseHighlight()
}

async function addSheet() {
  if (!currentCourse) return showError('Select a course first')
  const name = document.getElementById('sheet-name').value.trim()
  const notBefore = document.getElementById('not-before').value
  const notAfter = document.getElementById('not-after').value
  if (!name || !notBefore || !notAfter) return showError('Fill all sheet fields')
  const res = await fetch(`${api}/courses/${currentCourse.termCode}/${currentCourse.section}/sheets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, notBefore, notAfter })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return showError(data.error || 'Error creating sheet')
  clearError()
  currentSheet = data
  await loadSheets(true)
}

async function loadSheets(keepSelection = false) {
  if (!currentCourse) return
  const res = await fetch(`${api}/courses/${currentCourse.termCode}/${currentCourse.section}/sheets`)
  const data = await res.json()
  const list = document.getElementById('sheet-list')
  list.innerHTML = ''
  data.forEach(s => {
    const li = document.createElement('li')
    li.dataset.id = s.id
    const text = document.createElement('span')
    text.textContent = `${s.id}: ${s.name}`
    li.appendChild(text)
    const actions = document.createElement('div')
    const open = document.createElement('button')
    open.textContent = currentSheet && currentSheet.id === s.id ? 'Close' : 'Open'
    open.onclick = () => toggleSheetSelection(s)
    const del = document.createElement('button')
    del.textContent = 'Delete'
    del.onclick = () => deleteSheet(s.id)
    actions.append(open, del)
    li.append(actions)
    if (currentSheet && currentSheet.id === s.id) li.classList.add('selected')
    list.appendChild(li)
  })
  if (keepSelection && currentSheet) {
    updateSheetHighlight()
    loadSlots()
  }
}

function updateSheetHighlight() {
  document.querySelectorAll('#sheet-list li').forEach(li => {
    const id = parseInt(li.dataset.id)
    if (currentSheet && id === currentSheet.id)
      li.classList.add('selected')
    else
      li.classList.remove('selected')
  })
}

function toggleSheetSelection(s) {
  if (currentSheet && currentSheet.id === s.id) {
    currentSheet = null
    document.getElementById('slot-list').innerHTML = ''
  } else {
    currentSheet = s
    loadSlots()
  }
  updateSheetHighlight()
}

async function deleteSheet(id) {
  const res = await fetch(`${api}/sheets/${id}`, { method: 'DELETE' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return showError(data.error || 'Error deleting sheet')
  clearError()
  if (currentSheet && currentSheet.id === id) currentSheet = null
  await loadSheets(true)
}

async function addSlot() {
  if (!currentSheet) return showError('Select a sheet first')
  const start = document.getElementById('slot-start').value
  const slotDuration = parseInt(document.getElementById('slot-duration').value)
  const numSlots = parseInt(document.getElementById('slot-num').value)
  const maxMembers = parseInt(document.getElementById('slot-max').value)
  if (!start || !slotDuration || !numSlots || !maxMembers) return showError('Fill all slot fields')
  const res = await fetch(`${api}/sheets/${currentSheet.id}/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start, slotDuration, numSlots, maxMembers })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return showError(data.error || 'Error adding slot')
  clearError()
  await loadSlots()
  updateSheetHighlight()
}

async function loadSlots() {
  if (!currentSheet) return
  const res = await fetch(`${api}/sheets/${currentSheet.id}/slots`)
  const data = await res.json()
  const list = document.getElementById('slot-list')
  list.innerHTML = ''
  data.forEach(sl => {
    const li = document.createElement('li')
    li.textContent = `Slot ${sl.id}: ${sl.start} | Max ${sl.maxMembers || sl.capacity}`
    list.appendChild(li)
  })
}

async function addGrade() {
  const memberId = document.getElementById('grade-member-id').value.trim()
  const sheetId = parseInt(document.getElementById('grade-sheet-id').value)
  const grade = parseInt(document.getElementById('grade-value').value)
  const comment = document.getElementById('grade-comment').value.trim()
  if (!memberId || !sheetId || Number.isNaN(grade)) return showError('Fill all grade fields')
  const res = await fetch(`${api}/grades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId, sheetId, grade, comment })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return showError(data.error || 'Error adding grade')
  clearError()
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



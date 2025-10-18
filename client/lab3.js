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
  if (res.ok) {
    await loadCourses()
    clearError()
  } else {
    const data = await res.json().catch(()=>({}))
    showError(data.error || 'Error adding course')
  }
}

async function loadCourses() {
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
    label.textContent = `${c.termCode} - SEC 0${c.section}: ${c.name}`
    li.appendChild(label)
    const actions = document.createElement('div')
    actions.classList.add('course-actions')
    const selectBtn = document.createElement('button')
    selectBtn.classList.add('open-btn')
    const isSelected = currentCourse && currentCourse.termCode === c.termCode && currentCourse.section === c.section
    selectBtn.textContent = isSelected ? 'Deselect' : 'Select'
    selectBtn.onclick = () => toggleCourseSelection(c)
    const delBtn = document.createElement('button')
    delBtn.textContent = 'Delete'
    delBtn.classList.add('delete-btn')
    delBtn.onclick = async () => {
      await deleteCourse(c.termCode, c.section)
    }
    actions.append(selectBtn, delBtn)
    li.append(actions)
    if (isSelected) li.classList.add('selected')
    li.onclick = (e) => {
      if (e.target === selectBtn || e.target === delBtn) return
      toggleCourseSelection(c)
    }
    list.appendChild(li)
  })
}

function toggleCourseSelection(c) {
  if (currentCourse && currentCourse.termCode === c.termCode && currentCourse.section === c.section) {
    currentCourse = null
    document.getElementById('member-list').innerHTML = ''
    document.getElementById('sheet-list').innerHTML = ''
    document.getElementById('slot-list').innerHTML = ''
    document.getElementById('member-heading').textContent = 'Members'
  } else {
    currentCourse = c
    document.getElementById('member-heading').textContent = `Members — Editing ${c.name} (${c.termCode}-${c.section})`
    loadMembers()
    loadSheets()
  }
  loadCourses()
}

async function deleteCourse(termCode, section) {
  const res = await fetch(`${api}/courses/${termCode}/${section}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json().catch(()=>({}))
    return showError(data.error || 'Error deleting course')
  }
  if (currentCourse && currentCourse.termCode === termCode && currentCourse.section === section) currentCourse = null
  await loadCourses()
  document.getElementById('member-list').innerHTML = ''
  document.getElementById('sheet-list').innerHTML = ''
  document.getElementById('slot-list').innerHTML = ''
  document.getElementById('member-heading').textContent = 'Members'
  clearError()
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
  if (res.ok) {
    await loadMembers()
    clearError()
  } else {
    const data = await res.json().catch(()=>({}))
    showError(data.error || 'Error adding member')
  }
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
  const payload = { ids: [memberId] }
  const res = await fetch(`${api}/courses/${currentCourse.termCode}/${currentCourse.section}/members`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (res.ok) {
    await loadMembers()
    clearError()
  } else {
    const data = await res.json().catch(()=>({}))
    showError(data.error || 'Error deleting member')
  }
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
  if (res.ok) {
    await loadSheets()
    clearError()
  } else {
    const data = await res.json().catch(()=>({}))
    showError(data.error || 'Error creating sheet')
  }
}

async function loadSheets() {
  if (!currentCourse) return
  const res = await fetch(`${api}/courses/${currentCourse.termCode}/${currentCourse.section}/sheets`)
  const data = await res.json()
  const list = document.getElementById('sheet-list')
  list.innerHTML = ''
  
  data.forEach(s => {
    const li = document.createElement('li')
    li.dataset.id = s.id

    const label = document.createElement('span')
    label.textContent = `${s.id}: ${s.name}`
    li.appendChild(label)

    const actions = document.createElement('div')
    actions.classList.add('course-actions')

    const isSelected = currentSheet && currentSheet.id === s.id
    const selectBtn = document.createElement('button')
    selectBtn.textContent = isSelected ? 'Deselect' : 'Select'
    selectBtn.classList.add('open-btn')
    selectBtn.onclick = () => toggleSheetSelection(s)

    const delBtn = document.createElement('button')
    delBtn.textContent = 'Delete'
    delBtn.classList.add('delete-btn')
    delBtn.onclick = () => deleteSheet(s.id)

    actions.append(selectBtn, delBtn)
    li.append(actions)

    if (isSelected) li.classList.add('selected')

    list.appendChild(li)
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
  loadSheets()
}

async function deleteSheet(id) {
  const res = await fetch(`${api}/sheets/${id}`, { method: 'DELETE' })
  if (res.ok) {
    await loadSheets()
    clearError()
  } else {
    const data = await res.json().catch(()=>({}))
    showError(data.error || 'Error deleting sheet')
  }
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
  if (!start || !slotDuration || !numSlots || !maxMembers) return showError('Fill all slot fields')
  const res = await fetch(`${api}/sheets/${currentSheet.id}/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start, slotDuration, numSlots, maxMembers })
  })
  if (res.ok) {
    await loadSlots()
    clearError()
  } else {
    const data = await res.json().catch(()=>({}))
    showError(data.error || 'Error adding slot')
  }
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
  if (!res.ok) {
    const data = await res.json().catch(()=>({}))
    return showError(data.error || 'Error adding grade')
  }
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



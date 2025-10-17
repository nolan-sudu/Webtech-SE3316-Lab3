const API = 'http://localhost:3000/api/courses'
const list = document.getElementById('course-list')
const addBtn = document.getElementById('add')
const errorEl = document.getElementById('error')
const searchInput = document.getElementById('search-input')

let allCourses = []

async function loadCourses() {
  const res = await fetch(API)
  allCourses = await res.json()
  renderCourses(allCourses)
}

function renderCourses(courses) {
  list.innerHTML = ''
  for (const c of courses) {
    const li = document.createElement('li')
    const text = document.createElement('span')
    text.textContent = `${c.code} — ${c.name}`
    li.appendChild(text)

    const edit = document.createElement('button')
    edit.textContent = 'Edit'
    edit.onclick = () => editCourse(c, li)
    li.appendChild(edit)

    const del = document.createElement('button')
    del.textContent = 'Delete'
    del.onclick = () => deleteCourse(c.id)
    li.appendChild(del)

    list.appendChild(li)
  }
}

function editCourse(c, li) {
  li.innerHTML = ''
  const codeInput = document.createElement('input')
  codeInput.value = c.code
  const nameInput = document.createElement('input')
  nameInput.value = c.name
  const save = document.createElement('button')
  save.textContent = 'Save'
  save.onclick = () => saveCourse(c.id, codeInput.value, nameInput.value)
  li.append(codeInput, nameInput, save)
}

async function saveCourse(id, code, name) {
  errorEl.textContent = ''
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name })
  })
  if (res.ok) loadCourses()
  else {
    const data = await res.json().catch(() => ({}))
    errorEl.textContent = data.error || 'Failed to update course.'
  }
}

async function addCourse() {
  const code = document.getElementById('code').value.trim()
  const name = document.getElementById('name').value.trim()
  errorEl.textContent = ''
  if (!code || !name) {
    errorEl.textContent = 'Please enter both course code and name.'
    return
  }

  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name })
  })

  if (res.ok) {
    document.getElementById('code').value = ''
    document.getElementById('name').value = ''
    loadCourses()
  } else {
    const data = await res.json().catch(() => ({}))
    errorEl.textContent = data.error || 'Failed to add course.'
  }
}

async function deleteCourse(id) {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' })
  if (res.ok) loadCourses()
}

searchInput.addEventListener('input', e => {
  const term = e.target.value.toLowerCase()
  const filtered = allCourses.filter(
    c => c.code.toLowerCase().includes(term) || c.name.toLowerCase().includes(term)
  )
  renderCourses(filtered)
})

addBtn.onclick = addCourse
loadCourses()
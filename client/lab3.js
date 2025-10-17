const API = 'http://localhost:3000/api/courses'
const list = document.getElementById('course-list')
const addBtn = document.getElementById('add')
const errorEl = document.getElementById('error')

async function loadCourses() {
  list.innerHTML = ''
  const res = await fetch(API)
  const courses = await res.json()
  for (const c of courses) {
    const li = document.createElement('li')
    li.textContent = `${c.code} — ${c.name}`
    const del = document.createElement('button')
    del.textContent = 'Delete'
    del.onclick = () => deleteCourse(c.id)
    li.appendChild(del)
    list.appendChild(li)
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

addBtn.onclick = addCourse
loadCourses()
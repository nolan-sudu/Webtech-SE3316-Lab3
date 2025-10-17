const API = 'http://localhost:3000/api/courses'
const list = document.getElementById('course-list')
const addBtn = document.getElementById('add')

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
  if (!code || !name) return alert('Enter both code and name')
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, name })
  })
  if (res.ok) loadCourses()
  else alert('Failed to add course')
}

async function deleteCourse(id) {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' })
  if (res.ok) loadCourses()
  else alert('Delete failed')
}

addBtn.onclick = addCourse
loadCourses()
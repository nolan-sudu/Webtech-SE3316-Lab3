import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const file = path.join(dataDir, 'db.json')
const adapter = new JSONFile(file)
const db = new Low(adapter)

export async function init() {
  await db.read()
  db.data ||= {
    courses: [],
    sheets: [],
    slots: [],
    nextSheetId: 1,
    nextSlotId: 1
  }

  for (const c of db.data.courses) {
    c.members ||= []
  }

  await db.write()
}

export { db }
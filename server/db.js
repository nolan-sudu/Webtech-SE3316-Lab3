import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import fs from 'fs'
import path from 'path'

const dataDir = path.join(path.resolve(), 'server', 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const file = path.join(dataDir, 'db.json')
const adapter = new JSONFile(file)
export const db = new Low(adapter)

export async function init() {
  await db.read()
  db.data ||= {
    courses: [],
    sheets: [],
    slots: [],
    nextSheetId: 1,
    nextSlotId: 1
  }
  await db.write()
}
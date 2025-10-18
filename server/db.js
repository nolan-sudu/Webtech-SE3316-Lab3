import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, "data")
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const file = path.join(dataDir, "db.json")
const adapter = new JSONFile(file)
export const db = new Low(adapter, {})

export async function initDB() {
  await db.read()
  db.data ||= {}
  db.data.courses ||= []
  db.data.sheets ||= []
  db.data.grades ||= []
  db.data.nextSheetId ||= 1
  db.data.nextSlotId ||= 1
  await db.write()
}

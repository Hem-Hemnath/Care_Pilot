import * as XLSX from 'xlsx'
import type { MedicineRecord } from '../types'

const DB_NAME = 'carepilot_db'
const DB_VERSION = 1
const STORE_NAME = 'medicines'
const META_STORE = 'meta'

let db: IDBDatabase | null = null
let memIndex: MedicineRecord[] = []
let nameMap: Map<string, MedicineRecord> = new Map()

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

async function openDB(): Promise<IDBDatabase> {
  if (db) return db
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const d = (e.target as IDBOpenDBRequest).result
      if (!d.objectStoreNames.contains(STORE_NAME)) {
        d.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
      if (!d.objectStoreNames.contains(META_STORE)) {
        d.createObjectStore(META_STORE)
      }
    }
    req.onsuccess = (e) => { db = (e.target as IDBOpenDBRequest).result; resolve(db) }
    req.onerror = () => reject(req.error)
  })
}

async function saveRecordsToDB(records: MedicineRecord[]): Promise<void> {
  const d = await openDB()
  return new Promise((resolve, reject) => {
    const tx = d.transaction([STORE_NAME, META_STORE], 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const meta = tx.objectStore(META_STORE)
    store.clear()
    records.forEach((r) => store.put(r))
    meta.put(records.length, 'count')
    meta.put(Date.now(), 'savedAt')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function loadRecordsFromDB(): Promise<MedicineRecord[]> {
  const d = await openDB()
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result as MedicineRecord[])
    req.onerror = () => reject(req.error)
  })
}

async function getMetaCount(): Promise<number> {
  const d = await openDB()
  return new Promise((resolve) => {
    const tx = d.transaction(META_STORE, 'readonly')
    const store = tx.objectStore(META_STORE)
    const req = store.get('count')
    req.onsuccess = () => resolve((req.result as number) || 0)
    req.onerror = () => resolve(0)
  })
}

function buildIndex(records: MedicineRecord[]) {
  memIndex = records
  nameMap = new Map()
  records.forEach((r) => nameMap.set(normalize(r.medicineName), r))
}

function parseRow(raw: Record<string, unknown>, idx: number): MedicineRecord | null {
  const name = String(raw['Medicine Name'] || '').trim()
  if (!name) return null
  const pct = (k: string) => {
    const v = parseFloat(String(raw[k] || '').replace('%', ''))
    return isNaN(v) ? null : v
  }
  return {
    id: `${normalize(name)}_${idx}`.replace(/[^a-z0-9_]/g, ''),
    medicineName: name,
    composition: String(raw['Composition'] || '').trim(),
    uses: String(raw['Uses'] || '').trim(),
    sideEffects: String(raw['Side_effects'] || raw['Side Effects'] || '').trim(),
    imageUrl: String(raw['Image URL'] || '').trim(),
    manufacturer: String(raw['Manufacturer'] || '').trim(),
    excellentReviewPct: pct('Excellent Review %'),
    averageReviewPct: pct('Average Review %'),
    poorReviewPct: pct('Poor Review %'),
  }
}

// Load from IndexedDB on startup (returns count or 0 if nothing persisted)
export async function loadPersistedDataset(): Promise<number> {
  try {
    const count = await getMetaCount()
    if (count === 0) return 0
    const records = await loadRecordsFromDB()
    if (records.length === 0) return 0
    buildIndex(records)
    return records.length
  } catch {
    return 0
  }
}

// Import from XLSX file — parse, build index, persist to IndexedDB
export async function importDatasetFromFile(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[]
        const records: MedicineRecord[] = []
        const seen = new Set<string>()
        rows.forEach((row, i) => {
          const rec = parseRow(row, i)
          if (!rec) return
          const dupKey = normalize(rec.medicineName) + '_' + normalize(rec.manufacturer)
          if (seen.has(dupKey)) return
          seen.add(dupKey)
          records.push(rec)
        })
        buildIndex(records)
        await saveRecordsToDB(records)
        resolve(records.length)
      } catch (err) { reject(err) }
    }
    reader.onerror = () => reject(new Error('File read error'))
    reader.readAsArrayBuffer(file)
  })
}

// Relevance scoring for a single record against a normalized query
function scoreRecord(r: MedicineRecord, q: string): number {
  const name = normalize(r.medicineName)
  const composition = normalize(r.composition)
  const uses = normalize(r.uses)
  const manufacturer = normalize(r.manufacturer)

  if (name === q) return 100
  if (name.startsWith(q)) return 80
  if (composition.startsWith(q)) return 60
  if (name.includes(q)) return 50
  if (composition.includes(q)) return 40
  if (uses.includes(q)) return 30
  if (manufacturer.includes(q)) return 20
  return 0
}

// Ranked, relevance-based search across medicine name, composition, uses, manufacturer.
// Returns records sorted by relevance score descending, capped at limit.
// If query is empty, returns first `limit` records from the full index.
export function searchMedicines(query: string, limit = 50): MedicineRecord[] {
  const q = normalize(query)
  if (!q) return memIndex.slice(0, limit)

  const scored: Array<{ record: MedicineRecord; score: number }> = []
  for (const r of memIndex) {
    const score = scoreRecord(r, q)
    if (score > 0) scored.push({ record: r, score })
  }

  // Stable sort by score descending
  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((s) => s.record)
}

export function findMedicineByName(name: string): MedicineRecord | null {
  const k = normalize(name)
  if (nameMap.has(k)) return nameMap.get(k)!
  for (const r of memIndex) {
    if (normalize(r.medicineName).includes(k) || k.includes(normalize(r.medicineName))) return r
  }
  return null
}

export function getMedicineCount(): number { return memIndex.length }
export function getAllMedicines(): MedicineRecord[] { return memIndex }

// Alias for backward compatibility
export const rankedSearch = searchMedicines

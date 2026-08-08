// Medicine record from the XLSX dataset
export interface MedicineRecord {
  id: string
  medicineName: string
  composition: string
  uses: string
  sideEffects: string
  imageUrl: string
  manufacturer: string
  excellentReviewPct: number | null
  averageReviewPct: number | null
  poorReviewPct: number | null
}

// Analysis result
export interface AnalysisResult {
  medicine: MedicineRecord | null
  confidence: 'high' | 'medium' | 'low' | 'unknown'
  source: 'dataset' | 'ai' | 'none'
  rawAiText?: string
  error?: string
}

// Chat message
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  language: Language
}

// History entry
export interface HistoryEntry {
  id: string
  medicineName: string
  timestamp: Date
  verified: boolean
  thumbnailUrl?: string
  result: AnalysisResult
}

// Language
export type Language = 'en' | 'ta' | 'tanglish'

// Theme
export type Theme = 'light' | 'dark' | 'system'

// Dataset state
export type DatasetStatus = 'idle' | 'loading' | 'loaded' | 'error'

// Input mode
export type InputMode = 'camera' | 'upload' | 'voice' | 'link' | 'text'

// User Roles
export type UserRole = 'caregiver' | 'patient'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface PatientRecord {
  id: string
  name: string
  age: number
  conditions: string[]
  caregiverIds: string[]
  userId?: string
  createdAt: string
  updatedAt: string
}

export interface CabinetMedicine {
  id: string
  patientId: string
  name: string
  generic: string
  strength: string
  dose: string
  frequency: string
  times: string[]
  imageUrl?: string
  expiresOn?: string
  stock: number
  notes?: string
  source: 'scanner' | 'prescription' | 'manual'
  verified: boolean
  createdAt: string
  updatedAt: string
}

export interface ExtractedPrescriptionMedicine {
  name: string
  strength: string
  dose: string
  frequency: string
  timing: string[]
  duration: string
  confidence: number
}

export interface PrescriptionRecord {
  id: string
  patientId: string
  imageUrl: string
  extractedMedicines: ExtractedPrescriptionMedicine[]
  status: 'draft' | 'confirmed'
  createdAt: string
}

export interface SafetyWarning {
  id: string
  type: 'duplicate_ingredient' | 'interaction' | 'duplicate_medicine' | 'caution' | 'missing_info'
  severity: 'high' | 'medium' | 'low'
  medicines: string[]
  message: string
  recommendation: string
}

export interface SafetyCheckResult {
  status: 'clear' | 'warning' | 'insufficient_data'
  warnings: SafetyWarning[]
  checkedAt: string
}

export interface StripComparisonResult {
  status: 'MATCH' | 'MISMATCH' | 'UNKNOWN'
  prescriptionMedicine: string
  prescriptionStrength: string
  detectedMedicine: string
  detectedStrength: string
  nameMatch: boolean
  strengthMatch: boolean
  message: string
  confidence: 'high' | 'medium' | 'low'
}


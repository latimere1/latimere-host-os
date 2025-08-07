// src/types/Cleaning.ts

/**
 * Represents a cleaning task, as stored in the backend.
 * `scheduledDate` is the ISO date string (YYYY-MM-DD) used for calendar display.
 */
export type Cleaning = {
  /** Unique identifier */
  id: string
  /** The ID of the unit this cleaning belongs to */
  unitID: string
  /** Original date/time string from the backend (ISO 8601) */
  date: string
  /** Date only (YYYY-MM-DD) for calendar placement */
  scheduledDate: string
  /** Current status of the cleaning */
  status: 'scheduled' | 'completed' | 'missed'
  /** Username or ID of the person assigned to this cleaning */
  assignedTo?: string | null
  /** Human-readable name of the unit (optional, if joined in the query) */
  unitName?: string
}

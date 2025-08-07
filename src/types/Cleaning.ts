// src/types/Cleaning.ts
export type CleaningStatus = 'scheduled' | 'completed' | 'missed';

export interface Cleaning {
  id: string;
  unitID: string;

  /** ISO date string (YYYY-MM-DD) used for filtering / display */
  scheduledDate: string;

  /** raw ISO date-time from the DB (optional; not every page needs it) */
  date?: string;

  status: CleaningStatus;

  /** e-mail or sub of the assigned cleaner */
  assignedTo: string;

  /** ALWAYS a string – 'Unknown' is used when GraphQL returns null */
  unitName: string;
}

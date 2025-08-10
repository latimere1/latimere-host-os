// src/lib/roleRoutes.ts

/**
 * Map each Role to its “home” path.
 * When a user logs in, they’ll be redirected here.
 */
export const roleHome: Record<string,string> = {
  admin:     '/properties',
  owner:     '/properties',
  cleaner:   '/cleanings',
  handyman:  '/handyman/tasks',
  inspector: '/inspections',
  // add future roles here…
}

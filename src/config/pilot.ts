/** Pilot-only presentation defaults. Location records and permissions remain data-driven. */
export const PILOT = {
  state: 'Lagos State',
  lga: 'Ojo LGA',
  community: 'Ojo',
  areas: ['Ojo', 'Iba', 'Okokomaiko', 'Alaba', 'Ajangbadi', 'Shibiri', 'Ijanikin', 'Satellite Town', 'Trade Fair', 'Agaja'],
  flags: { powerReporting: true, liveMap: false, marketplace: true },
} as const

/** State-level options are nationwide; LGA/area detail is added only from verified imports. */
export const NIGERIAN_STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Federal Capital Territory', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos State', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'] as const

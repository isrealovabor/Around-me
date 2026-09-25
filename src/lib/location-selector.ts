export type LocationOption = { id: string; name: string; slug: string; type: string }

export const displayLgaName = (name: string) => name.replace(/\s+LGA$/i, '')
export const findLocationByName = (locations: LocationOption[], value: string, label: (location: LocationOption) => string = location => location.name) => locations.find(location => label(location).toLowerCase() === value.trim().toLowerCase()) ?? null
export const filterLocationOptions = (locations: LocationOption[], query: string, label: (location: LocationOption) => string = location => location.name) => locations.filter(location => label(location).toLowerCase().includes(query.trim().toLowerCase()))

import type { MapCenter } from './geography'

/** Lagos' 20 constitutionally recognised LGAs. LCDAs are intentionally not included here. */
export const LAGOS_LGAS = [
  { slug: 'agege-lga', name: 'Agege', center: [3.324, 6.615] as MapCenter },
  { slug: 'ajeromi-ifelodun-lga', name: 'Ajeromi-Ifelodun', center: [3.339, 6.454] as MapCenter },
  { slug: 'alimosho-lga', name: 'Alimosho', center: [3.275, 6.610] as MapCenter },
  { slug: 'amuwo-odofin-lga', name: 'Amuwo-Odofin', center: [3.308, 6.447] as MapCenter },
  { slug: 'apapa-lga', name: 'Apapa', center: [3.364, 6.447] as MapCenter },
  { slug: 'badagry-lga', name: 'Badagry', center: [2.887, 6.416] as MapCenter },
  { slug: 'epe-lga', name: 'Epe', center: [3.985, 6.584] as MapCenter },
  { slug: 'eti-osa-lga', name: 'Eti-Osa', center: [3.535, 6.446] as MapCenter },
  { slug: 'ibeju-lekki-lga', name: 'Ibeju-Lekki', center: [4.044, 6.470] as MapCenter },
  { slug: 'ifako-ijaiye-lga', name: 'Ifako-Ijaiye', center: [3.301, 6.674] as MapCenter },
  { slug: 'ikeja-lga', name: 'Ikeja', center: [3.351, 6.601] as MapCenter },
  { slug: 'ikorodu-lga', name: 'Ikorodu', center: [3.510, 6.619] as MapCenter },
  { slug: 'kosofe-lga', name: 'Kosofe', center: [3.390, 6.585] as MapCenter },
  { slug: 'lagos-island-lga', name: 'Lagos Island', center: [3.404, 6.454] as MapCenter },
  { slug: 'lagos-mainland-lga', name: 'Lagos Mainland', center: [3.378, 6.529] as MapCenter },
  { slug: 'mushin-lga', name: 'Mushin', center: [3.353, 6.532] as MapCenter },
  { slug: 'ojo-lga', name: 'Ojo', center: [3.178, 6.462] as MapCenter },
  { slug: 'oshodi-isolo-lga', name: 'Oshodi-Isolo', center: [3.321, 6.549] as MapCenter },
  { slug: 'shomolu-lga', name: 'Shomolu', center: [3.386, 6.540] as MapCenter },
  { slug: 'surulere-lga', name: 'Surulere', center: [3.353, 6.496] as MapCenter },
] as const

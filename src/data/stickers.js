// Lista correcta de cromos del álbum Panini Mundial 2026
// Extraída del listado oficial

const countryGroups = [
  { code: 'MEX', name: 'México', flagCode: 'mx' },
  { code: 'RSA', name: 'Rep. Sudáfrica', flagCode: 'za' },
  { code: 'KOR', name: 'Corea del Sur', flagCode: 'kr' },
  { code: 'CZE', name: 'Rep. Checa', flagCode: 'cz' },
  { code: 'CAN', name: 'Canadá', flagCode: 'ca' },
  { code: 'BIH', name: 'Bosnia Herzegovina', flagCode: 'ba' },
  { code: 'QAT', name: 'Qatar', flagCode: 'qa' },
  { code: 'SUI', name: 'Suiza', flagCode: 'ch' },
  { code: 'BRA', name: 'Brasil', flagCode: 'br' },
  { code: 'MAR', name: 'Marruecos', flagCode: 'ma' },
  { code: 'HAI', name: 'Haití', flagCode: 'ht' },
  { code: 'SCO', name: 'Escocia', flagCode: 'gb-sct' },
  { code: 'USA', name: 'Estados Unidos', flagCode: 'us' },
  { code: 'PAR', name: 'Paraguay', flagCode: 'py' },
  { code: 'AUS', name: 'Australia', flagCode: 'au' },
  { code: 'TUR', name: 'Turquía', flagCode: 'tr' },
  { code: 'GER', name: 'Alemania', flagCode: 'de' },
  { code: 'CUW', name: 'Curaçao', flagCode: 'cw' },
  { code: 'CIV', name: 'Costa de Marfil', flagCode: 'ci' },
  { code: 'ECU', name: 'Ecuador', flagCode: 'ec' },
  { code: 'NED', name: 'Países Bajos', flagCode: 'nl' },
  { code: 'JPN', name: 'Japón', flagCode: 'jp' },
  { code: 'SWE', name: 'Suecia', flagCode: 'se' },
  { code: 'TUN', name: 'Túnez', flagCode: 'tn' },
  { code: 'BEL', name: 'Bélgica', flagCode: 'be' },
  { code: 'EGY', name: 'Egipto', flagCode: 'eg' },
  { code: 'IRN', name: 'Irán', flagCode: 'ir' },
  { code: 'NZL', name: 'Nueva Zelanda', flagCode: 'nz' },
  { code: 'ESP', name: 'España', flagCode: 'es' },
  { code: 'CPV', name: 'Cabo Verde', flagCode: 'cv' },
  { code: 'KSA', name: 'Arabia Saudí', flagCode: 'sa' },
  { code: 'URU', name: 'Uruguay', flagCode: 'uy' },
  { code: 'FRA', name: 'Francia', flagCode: 'fr' },
  { code: 'SEN', name: 'Senegal', flagCode: 'sn' },
  { code: 'IRQ', name: 'Iraq', flagCode: 'iq' },
  { code: 'NOR', name: 'Noruega', flagCode: 'no' },
  { code: 'ARG', name: 'Argentina', flagCode: 'ar' },
  { code: 'ALG', name: 'Algeria', flagCode: 'dz' },
  { code: 'AUT', name: 'Austria', flagCode: 'at' },
  { code: 'JOR', name: 'Jordania', flagCode: 'jo' },
  { code: 'POR', name: 'Portugal', flagCode: 'pt' },
  { code: 'COD', name: 'Rep. Congo', flagCode: 'cd' },
  { code: 'UZB', name: 'Uzbequistán', flagCode: 'uz' },
  { code: 'COL', name: 'Colombia', flagCode: 'co' },
  { code: 'ENG', name: 'Inglaterra', flagCode: 'gb-eng' },
  { code: 'CRO', name: 'Croacia', flagCode: 'hr' },
  { code: 'GHA', name: 'Ghana', flagCode: 'gh' },
  { code: 'PAN', name: 'Panamá', flagCode: 'pa' },
]

export const stickers = []

// Cromos de selecciones: 1 al 20 sin cero delante
countryGroups.forEach((group) => {
  for (let i = 1; i <= 20; i++) {
    stickers.push({
      code: `${group.code}${i}`,
      groupCode: group.code,
      groupName: group.name,
      flagCode: group.flagCode,
      number: i,
    })
  }
})

// Especiales FWC: FWC00 + FWC1 a FWC19
stickers.push({
  code: 'FWC00',
  groupCode: 'FWC',
  groupName: 'FIFA World Cup',
  flagCode: null,
  logo: '/logos/fwc.png',
  number: 0,
})
for (let i = 1; i <= 19; i++) {
  stickers.push({
    code: `FWC${i}`,
    groupCode: 'FWC',
    groupName: 'FIFA World Cup',
    flagCode: null,
    logo: '/logos/fwc.png',
    number: i,
  })
}

// Especiales CC: CC1 a CC12
for (let i = 1; i <= 12; i++) {
  stickers.push({
    code: `CC${i}`,
    groupCode: 'CC',
    groupName: 'Coca-Cola',
    flagCode: null,
    logo: '/logos/cocacola.png',
    number: i,
  })
}

export const groupList = [
  ...countryGroups,
  { code: 'FWC', name: 'FIFA World Cup', flagCode: null, logo: '/logos/fwc.png' },
  { code: 'CC', name: 'Coca-Cola', flagCode: null, logo: '/logos/cocacola.png' },
]

export const totalStickers = stickers.length

// Lista correcta de cromos del álbum Panini Mundial 2026
// Extraída del listado oficial

const countryGroups = [
  { code: 'MEX', name: 'México', flag: '🇲🇽' },
  { code: 'RSA', name: 'Rep. Sudáfrica', flag: '🇿🇦' },
  { code: 'KOR', name: 'Corea del Sur', flag: '🇰🇷' },
  { code: 'CZE', name: 'Rep. Checa', flag: '🇨🇿' },
  { code: 'CAN', name: 'Canadá', flag: '🇨🇦' },
  { code: 'BIH', name: 'Bosnia Herzegovina', flag: '🇧🇦' },
  { code: 'QAT', name: 'Qatar', flag: '🇶🇦' },
  { code: 'SUI', name: 'Suiza', flag: '🇨🇭' },
  { code: 'BRA', name: 'Brasil', flag: '🇧🇷' },
  { code: 'MAR', name: 'Marruecos', flag: '🇲🇦' },
  { code: 'HAI', name: 'Haití', flag: '🇭🇹' },
  { code: 'SCO', name: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'USA', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'PAR', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
  { code: 'TUR', name: 'Turquía', flag: '🇹🇷' },
  { code: 'GER', name: 'Alemania', flag: '🇩🇪' },
  { code: 'CUW', name: 'Curaçao', flag: '🇨🇼' },
  { code: 'CIV', name: 'Costa de Marfil', flag: '🇨🇮' },
  { code: 'ECU', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'NED', name: 'Países Bajos', flag: '🇳🇱' },
  { code: 'JPN', name: 'Japón', flag: '🇯🇵' },
  { code: 'SWE', name: 'Suecia', flag: '🇸🇪' },
  { code: 'TUN', name: 'Túnez', flag: '🇹🇳' },
  { code: 'BEL', name: 'Bélgica', flag: '🇧🇪' },
  { code: 'EGY', name: 'Egipto', flag: '🇪🇬' },
  { code: 'IRN', name: 'Irán', flag: '🇮🇷' },
  { code: 'NZL', name: 'Nueva Zelanda', flag: '🇳🇿' },
  { code: 'ESP', name: 'España', flag: '🇪🇸' },
  { code: 'CPV', name: 'Cabo Verde', flag: '🇨🇻' },
  { code: 'KSA', name: 'Arabia Saudí', flag: '🇸🇦' },
  { code: 'URU', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'FRA', name: 'Francia', flag: '🇫🇷' },
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'IRQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'NOR', name: 'Noruega', flag: '🇳🇴' },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  { code: 'ALG', name: 'Algeria', flag: '🇩🇿' },
  { code: 'AUT', name: 'Austria', flag: '🇦🇹' },
  { code: 'JOR', name: 'Jordania', flag: '🇯🇴' },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹' },
  { code: 'COD', name: 'Rep. Congo', flag: '🇨🇩' },
  { code: 'UZB', name: 'Uzbequistán', flag: '🇺🇿' },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴' },
  { code: 'ENG', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'CRO', name: 'Croacia', flag: '🇭🇷' },
  { code: 'GHA', name: 'Ghana', flag: '🇬🇭' },
  { code: 'PAN', name: 'Panamá', flag: '🇵🇦' },
]

export const stickers = []

// Cromos de selecciones: 1 al 20 sin cero delante
countryGroups.forEach((group) => {
  for (let i = 1; i <= 20; i++) {
    stickers.push({
      code: `${group.code}${i}`,
      groupCode: group.code,
      groupName: group.name,
      flag: group.flag,
      number: i,
    })
  }
})

// Especiales FWC: FWC00 + FWC1 a FWC19
stickers.push({
  code: 'FWC00',
  groupCode: 'FWC',
  groupName: 'FIFA World Cup',
  flag: '🏆',
  number: 0,
})
for (let i = 1; i <= 19; i++) {
  stickers.push({
    code: `FWC${i}`,
    groupCode: 'FWC',
    groupName: 'FIFA World Cup',
    flag: '🏆',
    number: i,
  })
}

// Especiales CC: CC1 a CC14
for (let i = 1; i <= 14; i++) {
  stickers.push({
    code: `CC${i}`,
    groupCode: 'CC',
    groupName: 'Coca-Cola',
    flag: '⭐',
    number: i,
  })
}

export const groupList = [
  ...countryGroups,
  { code: 'FWC', name: 'FIFA World Cup', flag: '🏆' },
  { code: 'CC', name: 'Coca-Cola', flag: '⭐' },
]

export const totalStickers = stickers.length

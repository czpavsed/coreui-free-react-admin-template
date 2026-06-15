import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import logoSrc from 'src/assets/images/Logo.png'
import stampSrc from 'src/assets/images/Razitko.png'

const resolvedVfs = (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) || (pdfFonts && pdfFonts.vfs) || pdfFonts

if (resolvedVfs) {
  pdfMake.vfs = resolvedVfs
}

let cachedLogoDataUrl = null
let cachedStampDataUrl = null

pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
}

const gaugeBands = [
  { from: 0, to: 33.33, color: '#d9534f' },
  { from: 33.33, to: 66.66, color: '#f0ad4e' },
  { from: 66.66, to: 100, color: '#5cb85c' },
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const formatDate = (dateString) => {
  if (!dateString) return '-'

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'

  return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}.${date.getFullYear()}`
}

const formatPercent = (value) => {
  if (value === null || value === undefined || value === '') return '-'

  const numeric = Number(value)
  if (Number.isNaN(numeric)) return '-'

  return `${numeric.toFixed(1)} %`
}

const sanitizeFilePart = (value, fallback) => {
  const normalized = String(value || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase()

  return normalized || fallback
}

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ')
}

const createGaugeSvg = (value) => {
  const numericValue = Number(value)
  const safeValue = Number.isNaN(numericValue) ? 0 : clamp(numericValue, 0, 100)
  const rotation = -90 + safeValue * 1.8
  const displayValue = Number.isNaN(numericValue) ? '-' : `${safeValue.toFixed(1)} %`
  const statusLabel = safeValue < 33.33 ? 'Nízká' : safeValue < 66.66 ? 'Mírná' : 'Optimální'

  const arcs = gaugeBands
    .map((band) => {
      const startAngle = 270 + band.from * 1.8
      const endAngle = 270 + band.to * 1.8
      return `<path d="${describeArc(110, 110, 79, startAngle, endAngle)}" fill="none" stroke="${band.color}" stroke-width="62" stroke-linecap="butt" />`
    })
    .join('')

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="150" viewBox="0 0 220 150">
      ${arcs}
      <path d="M 41 110 A 69 69 0 0 1 179 110 L 179 110 L 41 110 Z" fill="#ffffff" />
      <g transform="translate(110 104) rotate(${rotation})">
        <rect x="-2" y="-78" width="4" height="84" rx="2" fill="#334155" />
      </g>
      <circle cx="110" cy="104" r="9" fill="#334155" stroke="#ffffff" stroke-width="3" />
      <text x="110" y="62" text-anchor="middle" font-family="Roboto" font-size="28" font-weight="700" fill="#1f2937">${displayValue}</text>
      <text x="110" y="82" text-anchor="middle" font-family="Roboto" font-size="12" fill="#6b7280">UV index</text>
      <text x="110" y="138" text-anchor="middle" font-family="Roboto" font-size="15" fill="#6b7280">${statusLabel}</text>
    </svg>
  `
}

const createStampPlaceholderSvg = () => `
  <svg xmlns="http://www.w3.org/2000/svg" width="180" height="120" viewBox="0 0 180 120">
    <rect x="8" y="8" width="164" height="104" rx="8" ry="8" fill="#fffaf3" stroke="#d68102" stroke-width="2" stroke-dasharray="7 5" />
    <text x="90" y="44" text-anchor="middle" font-family="Roboto" font-size="14" font-weight="700" fill="#d68102">RAZÍTKO FIRMY</text>
    <text x="90" y="64" text-anchor="middle" font-family="Roboto" font-size="12" fill="#7c2d12">a podpis technika</text>
    <line x1="28" y1="88" x2="152" y2="88" stroke="#9a3412" stroke-width="1.5" />
    <text x="90" y="104" text-anchor="middle" font-family="Roboto" font-size="10" fill="#9ca3af">placeholder pro finální razítko</text>
  </svg>
`

const assetToDataUrl = async (assetUrl) => {
  if (!assetUrl) return null
  const response = await fetch(assetUrl)
  const blob = await response.blob()

  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export const generateMeasurementProtocolPdf = async ({ historyItem, plannedItem, zakaznikNazev, technician }) => {
  const generatedAt = new Date().toLocaleString('cs-CZ')
  const customerLabel = zakaznikNazev || 'Zákazník'
  if (!cachedLogoDataUrl) {
    try {
      cachedLogoDataUrl = await assetToDataUrl(logoSrc)
    } catch {
      cachedLogoDataUrl = null
    }
  }
  if (!cachedStampDataUrl) {
    try {
      cachedStampDataUrl = await assetToDataUrl(stampSrc)
    } catch {
      cachedStampDataUrl = null
    }
  }

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [36, 32, 36, 36],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
      color: '#1f2937',
    },
    footer: {
      columns: [
        { text: `Derator s.r.o. | Klimentská 1746/52, Nové Město, 110 00 Praha | www.derator.cz | info@derator.cz`, fontSize: 8, color: '#6b7280' },
        { text: `Vygenerováno ${generatedAt}`, alignment: 'right', fontSize: 8, color: '#6b7280' },
      ],
      margin: [36, 0, 36, 14],
    },
    content: [
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'Protokol o měření účinnosti UVA lapačů', style: 'title' },
              { text: 'Derator s.r.o.', style: 'companyName' },
              { text: 'Klimentská 1746/52, Nové Město, 110 00 Praha', style: 'subtitle' },
              { text: 'Web: www.derator.cz | E-mail: info@derator.cz', style: 'subtitle' },
            ],
          },
          ...(cachedLogoDataUrl
            ? [
                {
                  width: 96,
                  image: cachedLogoDataUrl,
                  fit: [96, 96],
                  alignment: 'right',
                },
              ]
            : []),
        ],
      },
      {
        margin: [0, 20, 0, 12],
        table: {
          widths: ['*', '*'],
          body: [
            [
              { text: 'Zákazník', style: 'labelCell' },
              { text: 'Datum měření', style: 'labelCell' },
            ],
            [
              { text: customerLabel, style: 'valueCell' },
              { text: formatDate(historyItem?.DatumProvedeni), style: 'valueCell' },
            ],
            [
              { text: 'Technik', style: 'labelCell' },
              { text: 'Typ akce', style: 'labelCell' },
            ],
            [
              { text: technician?.fullName || '-', style: 'valueCell' },
              { text: historyItem?.TypAkceNazev || '-', style: 'valueCell' },
            ],
            [
              { text: 'Telefon technika', style: 'labelCell' },
              { text: 'Stav', style: 'labelCell' },
            ],
            [
              { text: technician?.phone || '-', style: 'valueCell' },
              { text: 'Provedeno', style: 'valueCellSuccess' },
            ],
            [
              { text: 'Další termín', style: 'labelCell' },
              { text: 'Pravidelnost', style: 'labelCell' },
            ],
            [
              { text: formatDate(plannedItem?.PristiTerminDatum), style: 'valueCell' },
              { text: plannedItem?.PravidelnostMesicu ? `${plannedItem.PravidelnostMesicu} měs.` : '-', style: 'valueCell' },
            ],
          ],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex % 2 === 0 ? '#f8fafc' : '#ffffff'),
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb',
        },
      },
      {
        columns: [
          {
            width: 250,
            stack: [
              { text: 'Naměřená UVA účinnost', style: 'sectionTitle' },
              { svg: createGaugeSvg(historyItem?.UVAUcinnostProcenta), margin: [0, 6, 0, 0] },
            ],
          },
          {
            width: '*',
            stack: [
              { text: 'Shrnutí měření', style: 'sectionTitle' },
              {
                margin: [0, 10, 0, 0],
                table: {
                  widths: [110, '*'],
                  body: [
                    [{ text: 'Výsledek', style: 'labelCell' }, { text: historyItem?.Vysledek || 'Měření provedeno', style: 'valueCell' }],
                    [{ text: 'UVA účinnost', style: 'labelCell' }, { text: formatPercent(historyItem?.UVAUcinnostProcenta), style: 'valueCell' }],
                    [{ text: 'Poznámka', style: 'labelCell' }, { text: historyItem?.Poznamka || plannedItem?.PlanPoznamka || '-', style: 'valueCell' }],
                  ],
                },
                layout: {
                  fillColor: (rowIndex) => (rowIndex % 2 === 0 ? '#fff7ed' : '#ffffff'),
                  hLineColor: () => '#fed7aa',
                  vLineColor: () => '#fed7aa',
                },
              },
            ],
          },
        ],
      },
      {
        margin: [0, 22, 0, 0],
        columns: [
          {
            width: '*',
            stack: [
              { text: 'Poznámka technika', style: 'sectionTitle' },
              {
                margin: [0, 8, 16, 0],
                table: {
                  widths: ['*'],
                  body: [[{ text: historyItem?.Poznamka || historyItem?.Vysledek || 'Bez doplňující poznámky.', style: 'noteCell' }]],
                },
                layout: {
                  hLineColor: () => '#e5e7eb',
                  vLineColor: () => '#e5e7eb',
                },
              },
            ],
          },
          {
            width: 180,
            stack: [
              { text: 'Razítko a podpis', style: 'sectionTitle', alignment: 'center' },
              ...(cachedStampDataUrl
                ? [
                    {
                      image: cachedStampDataUrl,
                      fit: [180, 120],
                      alignment: 'center',
                      margin: [0, 10, 0, 0],
                    },
                  ]
                : [{ svg: createStampPlaceholderSvg(), margin: [0, 10, 0, 0] }]),
            ],
          },
        ],
      },
    ],
    styles: {
      title: {
        fontSize: 21,
        bold: true,
        margin: [0, 8, 0, 6],
      },
      companyName: {
        fontSize: 11,
        bold: true,
        color: '#374151',
        margin: [0, 0, 0, 4],
      },
      subtitle: {
        fontSize: 10,
        color: '#6b7280',
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        color: '#111827',
      },
      labelCell: {
        fontSize: 9,
        color: '#6b7280',
        bold: true,
        margin: [0, 4, 0, 4],
      },
      valueCell: {
        fontSize: 10.5,
        margin: [0, 4, 0, 4],
      },
      valueCellSuccess: {
        fontSize: 10.5,
        bold: true,
        color: '#15803d',
        margin: [0, 4, 0, 4],
      },
      noteCell: {
        fontSize: 10,
        margin: [0, 10, 0, 40],
      },
    },
  }

  const safeCustomer = sanitizeFilePart(customerLabel, 'zakaznik')
  const safeDate = sanitizeFilePart(formatDate(historyItem?.DatumProvedeni), 'datum')
  pdfMake.createPdf(docDefinition).download(`uva-protokol-${safeCustomer}-${safeDate}.pdf`)
}
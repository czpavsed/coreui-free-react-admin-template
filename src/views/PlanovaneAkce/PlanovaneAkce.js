import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import api from 'src/api/apiClient'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CWidgetStatsF,
} from '@coreui/react'
import { UserContext } from './../../components/UserContext'
import { generateMeasurementProtocolPdf } from './pdfProtocol'

const UVA_CODES = new Set(['UVA_TEST'])

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

const normalizeActionType = (item) => {
  if (item.TypAkceKod && UVA_CODES.has(item.TypAkceKod)) return item.TypAkceKod

  const typeName = String(item.TypAkceNazev || '').toLowerCase()
  if (typeName.includes('měření') || typeName.includes('mereni')) return 'UVA_TEST'

  return null
}

const getPlannedStatus = (item) => {
  if (item.JePoTerminu) {
    return { text: 'Po termínu', color: 'danger' }
  }

  if (!item.PristiTerminDatum) {
    return { text: 'Bez termínu', color: 'secondary' }
  }

  return { text: 'Plánováno', color: 'warning' }
}

const getHistoryStatus = () => ({ text: 'Provedeno', color: 'success' })

const gaugeBands = [
  { from: 0, to: 33.33, color: '#d9534f' },
  { from: 33.33, to: 66.66, color: '#f0ad4e' },
  { from: 66.66, to: 100, color: '#5cb85c' },
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

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

const UvaGauge = ({ value }) => {
  const numericValue = Number(value)
  const safeValue = Number.isNaN(numericValue) ? 0 : clamp(numericValue, 0, 100)
  const displayValue = Number.isNaN(numericValue) ? '-' : `${safeValue.toFixed(1)} %`
  const statusLabel = safeValue < 33.33 ? 'Nízká' : safeValue < 66.66 ? 'Mírná' : 'Optimální'
  const [animatedValue, setAnimatedValue] = useState(0)
  const frameRef = useRef(null)

  useEffect(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }

    if (Number.isNaN(numericValue)) {
      setAnimatedValue(0)
      return undefined
    }

    const durationMs = 1700
    const startedAt = performance.now()

    const tick = (now) => {
      const elapsed = now - startedAt
      const progress = clamp(elapsed / durationMs, 0, 1)
      const eased = 1 - Math.pow(1 - progress, 2.4)
      const settleWindow = clamp((progress - 0.72) / 0.28, 0, 1)
      const wobble = Math.sin(settleWindow * Math.PI * 3.2) * (1 - settleWindow) * Math.max(safeValue * 0.035, 1.2)
      const nextValue = clamp(safeValue * eased + wobble, 0, 100)

      setAnimatedValue(progress >= 1 ? safeValue : nextValue)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [numericValue, safeValue])

  const rotation = -90 + animatedValue * 1.8

  return (
    <CCard className="mb-4 h-100">
      <CCardHeader>Poslední UVA účinnost</CCardHeader>
      <CCardBody className="d-flex flex-column align-items-center justify-content-center">
        <div
          style={{
            position: 'relative',
            width: '220px',
            height: '120px',
            overflow: 'hidden',
          }}
        >
          <svg
            viewBox="0 0 220 120"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            aria-hidden="true"
          >
            {gaugeBands.map((band) => {
              const startAngle = 270 + band.from * 1.8
              const endAngle = 270 + band.to * 1.8

              return (
                <path
                  key={`${band.from}-${band.to}`}
                  d={describeArc(110, 110, 79, startAngle, endAngle)}
                  fill="none"
                  stroke={band.color}
                  strokeWidth="62"
                  strokeLinecap="butt"
                />
              )
            })}
          </svg>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '0',
              width: '138px',
              height: '69px',
              transform: 'translateX(-50%)',
              borderTopLeftRadius: '138px',
              borderTopRightRadius: '138px',
              background: '#fff',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '6px',
              width: '4px',
              height: '84px',
              borderRadius: '999px',
              background: '#334155',
              transformOrigin: '50% calc(100% - 6px)',
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '2px',
              width: '18px',
              height: '18px',
              transform: 'translateX(-50%)',
              borderRadius: '50%',
              background: '#334155',
              border: '3px solid #fff',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '54px',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              color: '#1f2937',
            }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{displayValue}</div>
            <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '10px' }}>UV index</div>
          </div>
        </div>
        <div className="text-center mt-3">
          <div style={{ fontSize: '0.95rem', color: '#6b7280' }}>{statusLabel}</div>
        </div>
      </CCardBody>
    </CCard>
  )
}

const PlanovaneAkce = () => {
  const { zakaznikId, zakaznikNazev, userEmail } = useContext(UserContext)
  const [actions, setActions] = useState([])
  const [history, setHistory] = useState([])
  const [technician, setTechnician] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [generatingPdfId, setGeneratingPdfId] = useState(null)

  useEffect(() => {
    const fetchActions = async () => {
      if (!zakaznikId) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        const [actionsResponse, historyResponse, customersResponse] = await Promise.all([
          api.get('planovane-akce', {
            params: { zakaznikId },
          }),
          api.get('planovane-akce-historie', {
            params: { zakaznikId },
          }),
          api.get('customers', {
            params: { email: userEmail },
          }),
        ])

        const filtered = (actionsResponse.data || [])
          .filter((item) => normalizeActionType(item))
          .sort((left, right) => {
            const leftDate = left.PristiTerminDatum ? new Date(left.PristiTerminDatum).getTime() : Number.MAX_SAFE_INTEGER
            const rightDate = right.PristiTerminDatum ? new Date(right.PristiTerminDatum).getTime() : Number.MAX_SAFE_INTEGER
            return leftDate - rightDate
          })

        const filteredHistory = (historyResponse.data || []).filter((item) => normalizeActionType(item))
        const customerRow = (customersResponse.data || []).find((item) => item.ZakaznikId === zakaznikId)

        setActions(filtered)
        setHistory(filteredHistory)
        setTechnician(
          customerRow
            ? {
                fullName: [customerRow.Jmeno, customerRow.Prijmeni].filter(Boolean).join(' ').trim(),
                phone: customerRow.Telefon || '',
              }
            : null,
        )
      } catch (fetchError) {
        console.error('Chyba při načítání plánovaných UVA akcí:', fetchError)
        setError('Nepodařilo se načíst plánovaná měření a výměny UVA lapačů.')
      } finally {
        setLoading(false)
      }
    }

    fetchActions()
  }, [zakaznikId, userEmail])

  const measurementCount = actions.filter((item) => normalizeActionType(item) === 'UVA_TEST').length
  const overdueCount = actions.filter((item) => item.JePoTerminu).length
  const plannedByActionId = useMemo(
    () => new Map(actions.map((item) => [String(item.ZakaznikPlanovanaAkceId), item])),
    [actions],
  )
  const latestMeasurement = actions
    .filter((item) => normalizeActionType(item) === 'UVA_TEST' && item.PosledniUVAUcinnostProcenta !== null && item.PosledniUVAUcinnostProcenta !== undefined)
    .sort((left, right) => new Date(right.PosledniDatumProvedeni || 0) - new Date(left.PosledniDatumProvedeni || 0))[0]

  const handleExportPdf = async (historyItem) => {
    try {
      setGeneratingPdfId(historyItem.ZakaznikPlanovanaAkceProvedeniId)
      await generateMeasurementProtocolPdf({
        historyItem,
        plannedItem: plannedByActionId.get(String(historyItem.ZakaznikPlanovanaAkceId)),
        zakaznikNazev,
        technician,
      })
    } catch (pdfError) {
      console.error('Chyba při generování PDF protokolu:', pdfError)
      setError('Nepodařilo se vygenerovat PDF protokol měření.')
    } finally {
      setGeneratingPdfId(null)
    }
  }

  return (
    <>
      <CRow>
        <CCol sm={6} xl={3}>
          <CWidgetStatsF className="mb-4" color="info" title="Plánovaná měření" value={String(measurementCount)} />
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsF className="mb-4" color="warning" title="Záznamy historie" value={String(history.length)} />
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsF className="mb-4" color="danger" title="Po termínu" value={String(overdueCount)} />
        </CCol>
        <CCol sm={6} xl={3}>
          <CWidgetStatsF className="mb-4" color="success" title="Poslední měření" value={formatDate(latestMeasurement?.PosledniDatumProvedeni)} />
        </CCol>
      </CRow>

      <CRow className="mb-4">
        <CCol xl={8}>
          <CCard className="mb-4 h-100">
            <CCardHeader>Přehled posledního měření</CCardHeader>
            <CCardBody>
              <CRow>
                <CCol md={4}>
                  <div className="text-medium-emphasis small">Datum měření</div>
                  <div className="fw-semibold">{formatDate(latestMeasurement?.PosledniDatumProvedeni)}</div>
                </CCol>
                <CCol md={4}>
                  <div className="text-medium-emphasis small">Typ akce</div>
                  <div className="fw-semibold">{latestMeasurement?.TypAkceNazev || '-'}</div>
                </CCol>
                <CCol md={4}>
                  <div className="text-medium-emphasis small">Další termín</div>
                  <div className="fw-semibold">{formatDate(latestMeasurement?.PristiTerminDatum)}</div>
                </CCol>
              </CRow>
              <div className="mt-4 text-medium-emphasis small">Poznámka</div>
              <div className="fw-semibold">{latestMeasurement?.PosledniPoznamka || latestMeasurement?.PlanPoznamka || '-'}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xl={4}>
          <UvaGauge value={latestMeasurement?.PosledniUVAUcinnostProcenta} />
        </CCol>
      </CRow>

      <CCard className="mb-4">
        <CCardHeader>Plánovaná měření UVA lapačů</CCardHeader>
        <CCardBody>
          {loading ? (
            <div className="text-center">
              <CSpinner />
              <p>Načítám data...</p>
            </div>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : (
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Datum</CTableHeaderCell>
                  <CTableHeaderCell>Typ akce</CTableHeaderCell>
                  <CTableHeaderCell>Stav</CTableHeaderCell>
                  <CTableHeaderCell>Poznámka</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {actions.length > 0 ? (
                  actions.map((item) => {
                    const status = getPlannedStatus(item)

                    return (
                      <CTableRow key={item.ZakaznikPlanovanaAkceId}>
                        <CTableDataCell>{formatDate(item.PristiTerminDatum)}</CTableDataCell>
                        <CTableDataCell>{item.TypAkceNazev}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={status.color}>{status.text}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          {item.PlanPoznamka || item.PosledniPoznamka || (item.PravidelnostMesicu ? `Pravidelnost ${item.PravidelnostMesicu} měs.` : '-')}
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan={4} className="text-center">
                      Pro tohoto zákazníka nejsou evidovaná žádná plánovaná měření UVA lapačů.
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <CCard className="mb-4">
        <CCardHeader>Historie měření UVA lapačů</CCardHeader>
        <CCardBody>
          {loading ? (
            <div className="text-center">
              <CSpinner />
              <p>Načítám historii...</p>
            </div>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : (
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Datum</CTableHeaderCell>
                  <CTableHeaderCell>Typ akce</CTableHeaderCell>
                  <CTableHeaderCell>UVA účinnost</CTableHeaderCell>
                  <CTableHeaderCell>Stav</CTableHeaderCell>
                  <CTableHeaderCell>Poznámka</CTableHeaderCell>
                  <CTableHeaderCell>PDF</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {history.length > 0 ? (
                  history.map((item) => {
                    const status = getHistoryStatus()

                    return (
                      <CTableRow key={item.ZakaznikPlanovanaAkceProvedeniId}>
                        <CTableDataCell>{formatDate(item.DatumProvedeni)}</CTableDataCell>
                        <CTableDataCell>{item.TypAkceNazev}</CTableDataCell>
                        <CTableDataCell>{formatPercent(item.UVAUcinnostProcenta)}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={status.color}>{status.text}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>{item.Poznamka || item.Vysledek || '-'}</CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            color="primary"
                            size="sm"
                            onClick={() => handleExportPdf(item)}
                            disabled={generatingPdfId === item.ZakaznikPlanovanaAkceProvedeniId}
                          >
                            {generatingPdfId === item.ZakaznikPlanovanaAkceProvedeniId ? 'Generuji...' : 'Vygenerovat protokol'}
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className="text-center">
                      Historie měření UVA lapačů je zatím prázdná.
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}

export default PlanovaneAkce
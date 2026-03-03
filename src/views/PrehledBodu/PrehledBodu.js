import React, { useContext, useEffect, useMemo, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import api from 'src/api/apiClient'
import { UserContext } from './../../components/UserContext'

const PrehledBodu = () => {
  const { zakaznikId } = useContext(UserContext)

  const [checkpoints, setCheckpoints] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCheckpoints = async () => {
      if (!zakaznikId) return

      setLoading(true)
      setError(null)

      try {
        const response = await api.get('checkpoints', {
          params: { zakaznikId },
        })

        setCheckpoints(Array.isArray(response.data) ? response.data : [])
      } catch (e) {
        console.error('Chyba při načítání kontrolních bodů:', e)
        setError('Nepodařilo se načíst kontrolní body.')
      } finally {
        setLoading(false)
      }
    }

    fetchCheckpoints()
  }, [zakaznikId])

  const { rows, overallTotal } = useMemo(() => {
    const counts = new Map()
    const SEP = '\u0001'

    for (const item of checkpoints) {
      const serviceIdRaw = item?.SluzbaID ?? item?.SluzbaId
      const serviceName = item?.Služba || 'Neznámá služba'
      const baitName = item?.Nástraha || 'Bez nástrahy'

      const serviceId =
        typeof serviceIdRaw === 'number'
          ? serviceIdRaw
          : typeof serviceIdRaw === 'string' &&
              serviceIdRaw.trim() !== '' &&
              !Number.isNaN(Number(serviceIdRaw))
            ? Number(serviceIdRaw)
            : null

      const key = [serviceId ?? '', serviceName, baitName].join(SEP)
      counts.set(key, (counts.get(key) || 0) + 1)
    }

    const collator = new Intl.Collator('cs')

    const rows = Array.from(counts.entries())
      .map(([key, count]) => {
        const [serviceIdPart, serviceName, baitName] = key.split(SEP)
        const serviceId = serviceIdPart === '' ? null : Number(serviceIdPart)
        return { serviceId, serviceName, baitName, count }
      })
      .sort((a, b) => {
        const aId =
          typeof a.serviceId === 'number' && Number.isFinite(a.serviceId)
            ? a.serviceId
            : Number.POSITIVE_INFINITY
        const bId =
          typeof b.serviceId === 'number' && Number.isFinite(b.serviceId)
            ? b.serviceId
            : Number.POSITIVE_INFINITY
        if (aId !== bId) return aId - bId

        return collator.compare(a.baitName, b.baitName)
      })

    const overallTotal = checkpoints.length

    return { rows, overallTotal }
  }, [checkpoints])

  return (
    <CCard className="mb-4">
      <CCardHeader>Přehled kontrolních bodů</CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center">
            <CSpinner />
            <p>Načítám data...</p>
          </div>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : rows.length === 0 ? (
          <p>Žádné kontrolní body nebyly nalezeny.</p>
        ) : (
          <CTable hover responsive className="mt-2">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Služba</CTableHeaderCell>
                <CTableHeaderCell>Nástraha</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Počet kusů</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {rows.map((row) => (
                <CTableRow key={`${row.serviceName}::${row.baitName}`}>
                  <CTableDataCell>{row.serviceName}</CTableDataCell>
                  <CTableDataCell>{row.baitName}</CTableDataCell>
                  <CTableDataCell className="text-end">{row.count}</CTableDataCell>
                </CTableRow>
              ))}
              <CTableRow>
                <CTableDataCell colSpan={2} className="fw-semibold">
                  Celkem
                </CTableDataCell>
                <CTableDataCell className="text-end fw-semibold">{overallTotal}</CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  )
}

export default PrehledBodu

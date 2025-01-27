import React, { useEffect, useState, useContext } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CFormSelect,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CSpinner,
} from '@coreui/react'
import { UserContext } from './../../components/UserContext';
import { CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'

const TrendyDetail = () => {
  const { zakaznikId } = useContext(UserContext)
  const [trendData, setTrendData] = useState([])
  const [uniqueServices, setUniqueServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [filteredData, setFilteredData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTrends = async () => {
      if (!zakaznikId) {
        console.error('ZakaznikId není dostupné.')
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/trends?zakaznikId=${zakaznikId}`)
        const data = await response.json()

        const services = Array.from(
          new Map(data.map((item) => [item.SluzbaID, item.ServiceName])).entries()
        ).map(([SluzbaID, ServiceName]) => ({ SluzbaID, ServiceName }))
        setUniqueServices(services)

        if (services.length > 0) {
          setSelectedService(services[0].SluzbaID.toString())
          setFilteredData(data.filter((item) => item.SluzbaID.toString() === services[0].SluzbaID.toString()))
        }

        setTrendData(data)
      } catch (error) {
        console.error('Chyba při načítání dat:', error)
        setError('Nepodařilo se načíst data.')
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [zakaznikId])

  const handleServiceChange = (event) => {
    const selectedId = event.target.value
    setSelectedService(selectedId)
    const filtered = trendData.filter((item) => item.SluzbaID.toString() === selectedId)
    setFilteredData(filtered)
  }

  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}.${date.getFullYear()}`
  }

  const dataForChart = {
    labels: filteredData.map((item) => `${item.Month}/${item.Year}`),
    datasets: [
      {
        label: 'Požer/záchyt',
        backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
        borderColor: getStyle('--cui-info'),
        pointHoverBackgroundColor: getStyle('--cui-info'),
        borderWidth: 2,
        data: filteredData.map((item) => item.MaxStav),
      },
      {
        label: `Limit`,
        backgroundColor: `rgba(${getStyle('--cui-success-rgb')}, .1)`,
        borderColor: getStyle('--cui-success'),
        pointHoverBackgroundColor: getStyle('--cui-success'),
        borderWidth: 2,
        data: filteredData.map((item) => item.MaxTarget),
      },
    ],
  }

  const yAxisUnit = filteredData.length > 0 ? filteredData[0].Vyhodnocení_jednotka : ''

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <CRow>
          <CCol xs={6}>
            <h5>Trendy požerů a záchytů</h5>
          </CCol>
          <CCol xs={6}>
            <CFormSelect
              value={selectedService}
              onChange={handleServiceChange}
              aria-label="Vyberte službu"
            >
              {uniqueServices.map((service) => (
                <option key={service.SluzbaID} value={service.SluzbaID.toString()}>
                  {service.ServiceName}
                </option>
              ))}
            </CFormSelect>
          </CCol>
        </CRow>
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center">
            <CSpinner />
            <p>Načítám data...</p>
          </div>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <>
            <CChartLine
              data={dataForChart}
              options={{
                maintainAspectRatio: false,
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Měsíc/Rok',
                      color: getStyle('--cui-gray-800'),
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: `Hodnota (${yAxisUnit})`,
                      color: getStyle('--cui-gray-800'),
                    },
                    beginAtZero: true,
                  },
                },
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
              style={{ height: '400px', marginBottom: '30px' }}
            />
            <CTable hover responsive>
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Datum zásahu</CTableHeaderCell>
                  <CTableHeaderCell>Stav</CTableHeaderCell>
                  <CTableHeaderCell>Limit</CTableHeaderCell>
                  <CTableHeaderCell>Komentář</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <CTableRow key={`${item.Year}-${item.Month}`}>
                      <CTableDataCell>{formatDate(item.DatumZasahu)}</CTableDataCell>
                      <CTableDataCell>
                        {item.MaxStav} {item.Vyhodnocení_jednotka}
                      </CTableDataCell>
                      <CTableDataCell>
                        {item.MaxTarget} {item.Vyhodnocení_jednotka}
                      </CTableDataCell>
                      <CTableDataCell>{item.Komentar || '—'}</CTableDataCell>
                    </CTableRow>
                  ))
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan="4" className="text-center">
                      Žádné komentáře nebyly nalezeny.
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

export default TrendyDetail

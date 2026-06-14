import React, { useEffect, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import {
  CRow,
  CCol,
  CCard,
  CCardText,
  CCardTitle,
  CCardBody,
  CCardHeader,
  CFormSelect,
  CProgress,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import TrendChart from './TrendChart'
import { UserContext } from './../../components/UserContext'
import api from 'src/api/apiClient'

// Import obrázků
import Pavel from 'src/assets/images/Pavel.jpg'
import Tomáš from 'src/assets/images/Tomáš.jpg'
import Filip from 'src/assets/images/Filip.jpg'
import Jaromír from 'src/assets/images/Jaromír.jpg'
import Petr from 'src/assets/images/Petr.jpg'
import Libor from 'src/assets/images/Libor.jpg'
import Věra from 'src/assets/images/Věra.jpg'
import Avatar from 'src/assets/images/D.png'

const Dashboard = () => {
  const { zakaznikId, zakaznikNazev, userEmail, setZakaznikId, setZakaznikNazev, setZakaznikIC } =
    useContext(UserContext) // Přístup k zakaznikId a userEmail
  const [trendData, setTrendData] = useState([])
  const [uniqueServices, setUniqueServices] = useState([])
  const [data, setData] = useState([]) // Data pro karty
  const [availableCustomers, setAvailableCustomers] = useState([])
  const [checkpointsCount, setCheckpointsCount] = useState(null)
  const [checkpointsCountLoading, setCheckpointsCountLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!zakaznikId) {
        console.error('ZakaznikId není dostupné.')
        return
      }

      try {
        // Počet kontrolních bodů dle zakaznikId
        setCheckpointsCountLoading(true)
        try {
          const checkpointsResponse = await api.get('checkpoints', {
            params: { zakaznikId },
          })

          const count = Array.isArray(checkpointsResponse.data)
            ? checkpointsResponse.data.length
            : 0
          setCheckpointsCount(count)
        } catch (error) {
          console.error('Chyba při načítání kontrolních bodů:', error)
          setCheckpointsCount(null)
        } finally {
          setCheckpointsCountLoading(false)
        }

        // Načtení trendových dat podle zakaznikId
        const trendResponse = await api.get('trends', {
          params: { zakaznikId },
        })

        setTrendData(trendResponse.data)

        // Načtení dat pro karty s filtrováním dle zakaznikId
        const dataResponse = await api.get('customers', {
          params: { email: userEmail },
        })

        const rawData = dataResponse.data
        const uniqueCustomers = Array.from(
          new Map(rawData.map((item) => [item.ZakaznikId, item])).values(),
        )
        setAvailableCustomers(uniqueCustomers)

        // Filtrování podle zakaznikId
        const filteredData = rawData.filter((item) => item.ZakaznikId === zakaznikId)
        setData(filteredData)

        // Získání unikátních SluzbaID
        const services = Array.from(new Set(trendResponse.data.map((item) => item.SluzbaID)))
        setUniqueServices(services)
      } catch (error) {
        console.error('Chyba při načítání dat:', error)
      }
    }

    fetchData()
  }, [zakaznikId, userEmail]) // Aktualizace při změně zakaznikId

  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  const getImagePath = (employeeName) => {
    switch (employeeName) {
      case 'Pavel':
        return Pavel
      case 'Tomáš':
        return Tomáš
      case 'Filip':
        return Filip
      case 'Jaromír':
        return Jaromír
      case 'Petr':
        return Petr
      case 'Libor':
        return Libor
      case 'Věra':
        return Věra
      default:
        return Avatar
    }
  }

  const otherCustomers = availableCustomers.filter((customer) => customer.ZakaznikId !== zakaznikId)

  const handleCustomerCardClick = (customer) => {
    setZakaznikId(customer.ZakaznikId)
    setZakaznikNazev(customer.Nazev)
    setZakaznikIC(customer.IC)
  }

  return (
    <>
      {/* Karty Plánovaná kontrola a Technik */}
      <CRow className="mb-3">
        {data.map((item, index) => (
          <CCol xs={12} key={index}>
            <CRow className="align-items-stretch g-3">
              {/* Plánovaná kontrola */}
              <CCol xs={12} md={6} xl={otherCustomers.length > 0 ? 3 : 4}>
                <div className="h-100">
                  <CCard textBgColor={item.Color} className={`h-100 border-${item.Color}`}>
                    <CCardHeader>Plánovaná kontrola:</CCardHeader>
                    <CCardBody>
                      <CCardTitle>{formatDate(item.DatumDalsiKontroly)}</CCardTitle>
                      <CCardText>Za {item.ZbyvajiciDny} dní.</CCardText>
                    </CCardBody>
                  </CCard>
                </div>
              </CCol>

              {/* Technik */}
              <CCol xs={12} md={6} xl={otherCustomers.length > 0 ? 3 : 4}>
                <div className="h-100">
                  <CCard textBgColor="primary" className={`h-100 border-${item.Color}`}>
                    <CCardHeader>Technik:</CCardHeader>
                    <CCardBody className="d-flex align-items-center">
                      <img
                        src={getImagePath(item.Jmeno)}
                        alt={`${item.Jmeno} ${item.Prijmeni}`}
                        style={{ width: '15%', borderRadius: '10px', marginRight: '10px' }}
                      />
                      <div>
                        <CCardTitle>
                          {item.Jmeno} {item.Prijmeni}
                        </CCardTitle>
                        <CCardText>Tel: {item.Telefon}</CCardText>
                      </div>
                    </CCardBody>
                  </CCard>
                </div>
              </CCol>

              {/* Kontrolní body */}
              <CCol xs={12} md={6} xl={otherCustomers.length > 0 ? 3 : 4}>
                <div className="h-100">
                  <CCard className="h-100">
                    <CCardHeader>Kontrolní body:</CCardHeader>
                    <CCardBody>
                      <CCardTitle className="text-end">
                        {checkpointsCountLoading ? 'Načítám…' : (checkpointsCount ?? '—')}
                      </CCardTitle>
                      <CCardText className="text-end">
                        <Link to="/PrehledBodu" className="text-decoration-none">
                          Přejít na přehled bodů
                        </Link>
                      </CCardText>
                    </CCardBody>
                  </CCard>
                </div>
              </CCol>

              {otherCustomers.length > 0 && (
                <CCol xs={12} md={6} xl={3}>
                  <div className="h-100">
                    <CCard className="h-100">
                      <CCardHeader>Objekt:</CCardHeader>
                      <CCardBody>
                        <div className="text-medium-emphasis text-truncate mb-2">
                          {zakaznikNazev || ' '}
                        </div>
                        <div>
                          <CFormSelect
                            key={zakaznikId}
                            aria-label="Výběr objektu"
                            defaultValue=""
                            onChange={(event) => {
                              const selectedCustomer = otherCustomers.find(
                                (customer) => String(customer.ZakaznikId) === event.target.value,
                              )

                              if (selectedCustomer) {
                                handleCustomerCardClick(selectedCustomer)
                              }
                            }}
                          >
                            <option value="">Vyberte objekt</option>
                            {otherCustomers.map((customer) => (
                              <option key={customer.ZakaznikId} value={customer.ZakaznikId}>
                                {customer.Nazev}
                              </option>
                            ))}
                          </CFormSelect>
                        </div>
                      </CCardBody>
                    </CCard>
                  </div>
                </CCol>
              )}
            </CRow>
          </CCol>
        ))}
      </CRow>

      {/* Trendy Požerů a Záchytů */}
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>Trendy za posledních 12 měsíců</CCardHeader>
            <CCardBody>
              <CRow>
                {trendData.length === 0 ? (
                  <p>Načítám data nebo nejsou dostupná data pro zobrazení.</p>
                ) : (
                  uniqueServices.map((serviceId) => {
                    const serviceData = trendData.filter((item) => item.SluzbaID === serviceId)
                    return (
                      <CCol xs={12} sm={6} md={4} lg={3} key={serviceId} className="mb-4">
                        <TrendChart trendData={serviceData} />
                      </CCol>
                    )
                  })
                )}
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard

import React, { useEffect, useState, useContext } from 'react'
import {
  CRow,
  CCol,
  CCard,
  CCardText,
  CCardTitle,
  CCardBody,
  CCardHeader,
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
import axios from 'axios'

// Načtení API klíče z .env souboru pro Vite
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;
const API_BASE_URL = import.meta.env.VITE_API_API_URL;

const Dashboard = () => {
  const { zakaznikId, userEmail } = useContext(UserContext) // Přístup k zakaznikId a userEmail
  const [trendData, setTrendData] = useState([])
  const [uniqueServices, setUniqueServices] = useState([])
  const [data, setData] = useState([]) // Data pro karty

  useEffect(() => {
    const fetchData = async () => {
      if (!zakaznikId) {
        console.error('ZakaznikId není dostupné.')
        return
      }

      try {
        // Načtení trendových dat podle zakaznikId
        const trendResponse = await axios.get(`${API_BASE_URL}trends`, {
          params: { zakaznikId },
          headers: {
            'Authorization': `Bearer ${API_ACCESS_KEY}`,
          },
        });

        setTrendData(trendResponse.data)

        // Načtení dat pro karty s filtrováním dle zakaznikId
        const dataResponse = await axios.get(`${API_BASE_URL}customers`, {
          params: { email: userEmail },
          headers: {
            'Authorization': `Bearer ${API_ACCESS_KEY}`,
          },
        });

        const rawData = dataResponse.data

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

  return (
    <>
      {/* Karty Plánovaná kontrola a Technik */}
      <CRow>
        {data.map((item, index) => (
          <CCol sm={6} key={index}>
            <CRow>
              {/* Plánovaná kontrola */}
              <CCol sm={6}>
                <CCard textBgColor={item.Color} className={`mb-3 border-${item.Color}`}>
                  <CCardHeader>Plánovaná kontrola:</CCardHeader>
                  <CCardBody>
                    <CCardTitle>{formatDate(item.DatumDalsiKontroly)}</CCardTitle>
                    <CCardText>Za {item.ZbyvajiciDny} dní.</CCardText>
                  </CCardBody>
                </CCard>
              </CCol>

              {/* Technik */}
              <CCol sm={6}>
                <CCard textBgColor="primary" className={`mb-3 border-${item.Color}`}>
                  <CCardHeader>Technik:</CCardHeader>
                  <CCardBody className="d-flex align-items-center">
                    <img
                      src={`src/assets/images/${item.Jmeno}.jpg`}
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
              </CCol>
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
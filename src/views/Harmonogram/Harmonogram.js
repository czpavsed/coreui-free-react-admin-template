import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CSpinner,
  CRow,
  CCol,
} from '@coreui/react';
import { UserContext } from './../../components/UserContext';
import { CChartBar } from '@coreui/react-chartjs';

// Načtení API klíče z .env souboru pro Vite
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;

const Harmonogram = () => {
  const { zakaznikId } = useContext(UserContext); // Získání zakaznikId z kontextu
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!zakaznikId) {
        console.error('ZakaznikId není dostupné.');
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get('/api/harmonogram', {
          params: { zakaznikId },
          headers: {
            'Authorization': `Bearer ${API_ACCESS_KEY}`,
          },
        });

        // Seřadíme data podle datumu
        const sortedData = response.data.sort(
          (a, b) => new Date(a.PlanovaneDatum) - new Date(b.PlanovaneDatum)
        );
        setScheduleData(sortedData);
      } catch (error) {
        console.error('Chyba při načítání harmonogramu:', error);
        setError('Nepodařilo se načíst harmonogram kontrol.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [zakaznikId]);

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatDateToMonthYear = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${year}`;
  };

  const groupedData = scheduleData.reduce((acc, item) => {
    const key = formatDateToMonthYear(item.PlanovaneDatum);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item.StatusKontrolyFlag);
    return acc;
  }, {});

  const chartLabels = Object.keys(groupedData).sort((a, b) => {
    const [monthA, yearA] = a.split('/').map(Number);
    const [monthB, yearB] = b.split('/').map(Number);
    return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
  });

  const chartData = chartLabels.map((label) => {
    const statuses = groupedData[label];
    return statuses.includes(1) ? 1 : 0; // Pokud obsahuje proběhlou kontrolu, použije barvu pro proběhlé
  });

  const chartColors = chartData.map((status) =>
    status === 1 ? '#28a745' : '#f9c74f' // Zelená pro proběhlé, žlutá pro plánované
  );

  const statusText = (status) => (status === 1 ? 'Proběhlá' : 'Plánovaná');

  return (
    <CCard className="mb-4">
      <CCardHeader>Harmonogram kontrol</CCardHeader>
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
            <CRow>
              <CCol xs={12}>
                <CChartBar
                  style={{ height: '150px', width: '100%' }} // Nastavení pevné výšky a plné šířky
                  data={{
                    labels: chartLabels,
                    datasets: [
                      {
                        label: 'Kontroly',
                        backgroundColor: chartColors,
                        data: Array(chartLabels.length).fill(1), // Stejná výška všech sloupců
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false, // Umožní přizpůsobení výšky a šířky
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Měsíc/Rok',
                        },
                        grid: { display: false },
                      },
                      y: {
                        display: false, // Skryje osu Y
                        grid: { display: false },
                      },
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (tooltipItem) => {
                            const status = chartData[tooltipItem.dataIndex];
                            return `Status: ${statusText(status)}`;
                          },
                        },
                      },
                    },
                  }}
                />
              </CCol>
            </CRow>
            <CTable hover responsive className="mt-4">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Datum</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Pravidelnost</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {scheduleData.length > 0 ? (
                  scheduleData.map((item, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell>{formatDate(item.PlanovaneDatum)}</CTableDataCell>
                      <CTableDataCell
                        style={{
                          color: item.StatusKontrolyFlag === 1 ? '#28a745' : '#f9c74f',
                          fontWeight: 'bold',
                        }}
                      >
                        {item.StatusKontroly}
                      </CTableDataCell>
                      <CTableDataCell>{item.PravidelnostNazev}</CTableDataCell>
                    </CTableRow>
                  ))
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan="3" className="text-center">
                      Žádné kontroly nebyly nalezeny.
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          </>
        )}
      </CCardBody>
    </CCard>
  );
};

export default Harmonogram;
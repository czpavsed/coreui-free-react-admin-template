import React from 'react'
import { CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import { cilCheckCircle, cilWarning } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const TrendChart = ({ trendData }) => {
  const uniqueServices = Array.from(new Set(trendData.map((item) => item.SluzbaID)))

  return (
    <div className="trend">
      {uniqueServices.map((serviceId) => {
        const serviceData = trendData.filter((item) => item.SluzbaID === serviceId)
        const serviceName = serviceData.length > 0 ? serviceData[0].ServiceName : 'Neznámá služba'

        const sortedServiceData = serviceData.sort(
          (a, b) => new Date(a.Year, a.Month - 1) - new Date(b.Year, b.Month - 1),
        )

        const maxLimit = Math.max(...sortedServiceData.map((item) => item.MaxTarget))
        const vyhodnoceniJednotka =
          serviceData.length > 0 ? serviceData[0].Vyhodnocení_jednotka : ''

        const lastValue =
          sortedServiceData.length > 0 ? sortedServiceData[sortedServiceData.length - 1].MaxStav : 0
        const lastComment =
          sortedServiceData.length > 0 ? sortedServiceData[sortedServiceData.length - 1].Komentar : ''

        const isOk = lastValue <= maxLimit

        const data = {
          labels: sortedServiceData.map((item) => `${item.Month}/${item.Year}`),
          datasets: [
            {
              label: 'Požer/záchyt',
              backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
              borderColor: getStyle('--cui-info'),
              pointHoverBackgroundColor: getStyle('--cui-info'),
              borderWidth: 2,
              data: sortedServiceData.map((item) => item.MaxStav),
            },
            {
              label: `Limit - ${maxLimit} ${vyhodnoceniJednotka}`,
              backgroundColor: `rgba(${getStyle('--cui-success-rgb')}, .1)`,
              borderColor: getStyle('--cui-success'),
              pointHoverBackgroundColor: getStyle('--cui-success'),
              borderWidth: 2,
              data: sortedServiceData.map((item) => item.MaxTarget),
            },
          ],
        }

        return (
          <CCard className="mb-4" key={serviceId}>
            <CCardHeader>
              <div className="text-medium-emphasis medium">{serviceName}</div>
            </CCardHeader>
            <CCardBody>
              <CChartLine
                style={{ height: '150px', marginTop: '10px' }}
                data={data}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      grid: {
                        display: false, // Skryje mřížkové čáry osy X
                      },
                      ticks: {
                        display: false, // Skryje popisky osy X
                      },
                      border: {
                        display: true, // Zobrazí osu X
                        color: getStyle('--cui-gray-500'), // Nastaví barvu osy X
                      },
                    },
                    y: {
                      grid: {
                        display: false, // Skryje mřížkové čáry osy Y
                      },
                      ticks: {
                        display: false, // Skryje popisky osy Y
                      },
                      border: {
                        display: true, // Zobrazí osu Y
                        color: getStyle('--cui-gray-500'), // Nastaví barvu osy Y
                      },
                      min: 0,
                      beginAtZero: true,
                    },
                  },
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                    tooltip: {
                      enabled: false,
                    },
                  },
                }}
              />
              <div className="d-flex align-items-center mt-3">
                <CIcon
                  icon={isOk ? cilCheckCircle : cilWarning}
                  style={{ color: isOk ? 'green' : '#edad21', marginRight: '10px' }}
                />
                <p className="mb-0">{lastComment}</p>
              </div>
            </CCardBody>
          </CCard>
        )
      })}
    </div>
  )
}

export default TrendChart

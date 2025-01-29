import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import {
  CCard,
  CButton,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CSpinner,
} from '@coreui/react'
import { UserContext } from './../../components/UserContext';

const Invoice = () => {
  const [invoices, setInvoices] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { zakaznikIC } = useContext(UserContext)

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!zakaznikIC) {
        setError('Chybí zákaznické IC.')
        return
      }

      const email = import.meta.env.VITE_API_EMAIL;
      const apiKey = import.meta.env.VITE_API_KEY;      


      if (!email || !apiKey) {
        setError('Chybí email nebo API klíč.')
        return
      }

      const auth = btoa(`${email}:${apiKey}`)
      setLoading(true)

      try {
        const response = await axios.get(`https://api.vyfakturuj.cz/2.0/invoice/`, {
          params: {
            q: zakaznikIC,
            rows_limit: 5,
            sort: "date_created~desc",
          },
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: '*/*',
          },
        })
        setInvoices(response.data)
      } catch (err) {
        console.error('Chyba při načítání faktur:', err)
        setError('Nepodařilo se načíst faktury.')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [zakaznikIC])

  const formatCurrency = (value, currency) =>
    new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: currency,
    }).format(value)

  const formatDate = (dateString) => {
    if (!dateString || dateString === "0000-00-00") return null
    const [year, month, day] = dateString.split("-")
    return `${day}.${month}.${year}`
  }

  const isPaid = (datePaid) => {
    return datePaid && datePaid !== "0000-00-00" ? "Zaplacená" : "Nezaplacená"
  }

  return (
    <CCard className="mb-3">
      <CCardHeader>Seznam faktur</CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center">
          <CSpinner />
          <p>Načítám data...</p>
        </div>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <CTable>
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Číslo faktury</CTableHeaderCell>
                <CTableHeaderCell className="d-none d-sm-table-cell">Zákazník</CTableHeaderCell>
                <CTableHeaderCell className="d-none d-sm-table-cell">Datum vystavení</CTableHeaderCell>
                <CTableHeaderCell className="d-none d-sm-table-cell">Celková částka</CTableHeaderCell>
                <CTableHeaderCell>Stav</CTableHeaderCell>
                <CTableHeaderCell>Stáhnout</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <CTableRow key={invoice.id}>
                    <CTableDataCell>{invoice.number}</CTableDataCell>
                    <CTableDataCell className="d-none d-sm-table-cell">{invoice.customer_name}</CTableDataCell>
                    <CTableDataCell className="d-none d-sm-table-cell">{formatDate(invoice.date_created)}</CTableDataCell>
                    <CTableDataCell className="d-none d-sm-table-cell">{formatCurrency(invoice.total, invoice.currency)}</CTableDataCell>
                    <CTableDataCell>{isPaid(invoice.date_paid)}</CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="success"
                        onClick={() => window.open(invoice.url_download_pdf, '_blank')}
                      >
                        Stáhnout
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan="6">Žádné faktury nebyly nalezeny.</CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  )
}

export default Invoice

import React, { useEffect, useState, useContext } from 'react'
import { UserContext } from '../UserContext'
import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebaseConfig'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// Načtení API klíče z .env souboru pro Vite
const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  const { userEmail, setUserEmail, zakaznikId, setZakaznikId, zakaznikNazev, setZakaznikNazev, zakaznikIC, setZakaznikIC } = useContext(UserContext)

  const [customers, setCustomers] = useState([]) // Stav pro seznam zákazníků

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error('Error during sign out:', error)
    }
  }

  const user = auth.currentUser
  let initials = '??'

  if (user) {
    const fullName = user.displayName || null
    if (fullName) {
      const parts = fullName.trim().split(' ')
      initials = parts.map((part) => part[0].toUpperCase()).join('')
    } else if (user.email) {
      const emailNamePart = user.email.split('@')[0]
      initials = emailNamePart[0].toUpperCase()
      if (emailNamePart.length > 1) {
        initials += emailNamePart[1].toUpperCase()
      }
    }
  }

  useEffect(() => {
    if (user && user.email && userEmail !== user.email) {
      setUserEmail(user.email)
    }
  }, [user, userEmail, setUserEmail])

  // Načtení zákazníků s ověřením API klíčem
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get('/api/customers', {
          params: { email: userEmail },
          headers: {
            'Authorization': `Bearer ${API_ACCESS_KEY}`,
          },
        })

        const data = response.data
        setCustomers(data) // Uložíme všechny zákazníky

        if (data.length > 0) {
          setZakaznikId(data[0].ZakaznikId)
          setZakaznikNazev(data[0].Nazev)
          setZakaznikIC(data[0].IC)
        }
      } catch (error) {
        console.error('Error fetching customer data:', error)
      }
    }

    if (userEmail) {
      fetchCustomers()
    }
  }, [userEmail, setZakaznikId, setZakaznikNazev, setZakaznikIC])

  // Funkce pro změnu zákazníka
  const handleCustomerSelect = (customer) => {
    setZakaznikId(customer.ZakaznikId)
    setZakaznikNazev(customer.Nazev)
    setZakaznikIC(customer.IC)
  }

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar color="warning" textColor="white" shape="rounded" size="md">
          {initials}
        </CAvatar>
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">
          Zákazník: {zakaznikId} - {zakaznikIC}
        </CDropdownHeader>

        {/* Dropdown pro výběr zákazníka */}
        <CDropdownHeader className="bg-body-secondary fw-semibold">Vyberte zákazníka</CDropdownHeader>
        {customers.length > 0 ? (
          customers.map((customer) => (
            <CDropdownItem
              key={customer.ZakaznikId}
              active={customer.ZakaznikId === zakaznikId}
              onClick={() => handleCustomerSelect(customer)}
            >
              {customer.Nazev}
            </CDropdownItem>
          ))
        ) : (
          <CDropdownItem disabled>Žádní zákazníci</CDropdownItem>
        )}

        <CDropdownDivider />

        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">{userEmail}</CDropdownHeader>

        <CDropdownDivider />
        <CDropdownItem onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Odhlásit se
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
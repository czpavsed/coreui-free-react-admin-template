import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilClipboard,
  cilChartLine,
  cilCalendarCheck,
  cilFile,
  cilNotes,
  cilTask,
  cilShieldAlt,
  cilPaintBucket,
  cilObjectGroup,
  cilHandPointDown,
  cilCheckCircle,
  cilCheck,
  cilMap,
  cilLocationPin,
  cilFlagAlt,
} from '@coreui/icons'
import { CNavTitle, CNavItem } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'info',
      text: 'NEW',
    },
  },
  // ✅ Reporting (viditelné podkategorie)
  {
    component: CNavTitle,
    name: 'Reporting', // Hlavní kategorie
  },
  {
    component: CNavItem,
    name: 'Vyhodnocení kontrol',
    to: '/Kontroly',
    icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />, // Ikona pro Kontroly
  },
  {
    component: CNavItem,
    name: 'Roční trendy',
    to: '/Trendy',
    icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />, // Ikona pro Trendy
  },
  {
    component: CNavItem,
    name: 'Vývojové trendy',
    to: '/TrendyDetail',
    icon: <CIcon icon={cilChartLine} customClassName="nav-icon" />, // Ikona pro Trendy Detail
  },
  {
    component: CNavItem,
    name: 'Kontrolní body',
    to: '/StanickyDetail',
    icon: <CIcon icon={cilFlagAlt} customClassName="nav-icon" />, // Ikona pro Trendy Detail
  },

  // ✅ Harmonogram
  {
    component: CNavItem,
    name: 'Harmonogram',
    to: '/Harmonogram',
    icon: <CIcon icon={cilCalendarCheck} customClassName="nav-icon" />, // Ikona pro Harmonogram
  },
  {
    component: CNavItem,
    name: 'Mapy umístění bodů',
    to: '/Mapy',
    icon: <CIcon icon={cilLocationPin} customClassName="nav-icon" />, // Ikona pro Harmonogram
  },

  // ✅ Faktury a dokumenty
  {
    component: CNavTitle,
    name: 'Dokumenty', // Hlavní kategorie
  },
  {
    component: CNavItem,
    name: 'Faktury',
    to: '/Invoice',
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />, // Ikona pro Invoice
  },
  {
    component: CNavItem,
    name: 'Bezpečnostní listy',
    to: '/SafetyLists',
    icon: <CIcon icon={cilShieldAlt} customClassName="nav-icon" />, // Ikona pro Bezpečnostní listy
  },
  {
    component: CNavItem,
    name: 'Certifikáty',
    to: '/Certifikaty',
    icon: <CIcon icon={cilFile} customClassName="nav-icon" />, // Ikona pro Certifikáty
  },
]

export default _nav

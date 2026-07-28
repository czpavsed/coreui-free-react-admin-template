import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Link, useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { auth } from '../../../firebaseConfig'
import {
  isSignInWithEmailLink,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
} from 'firebase/auth'
import logo from 'src/assets/images/Logo.png'

const EMAIL_LINK_STORAGE_KEY = 'derator.emailForSignIn'

function getEmailLinkActionCodeSettings() {
  const origin = window.location.origin
  const path = window.location.pathname || '/'

  return {
    url: `${origin}${path}#/login`,
    handleCodeInApp: true,
  }
}

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('') // Pro ukládání UI hlášek
  const [userForVerification, setUserForVerification] = useState(null)
  const [loginMethod, setLoginMethod] = useState('password')
  const [sendingLink, setSendingLink] = useState(false)
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false)
  const [processingLink, setProcessingLink] = useState(false)
  const [pendingEmailLink, setPendingEmailLink] = useState('')
  const navigate = useNavigate()

  React.useEffect(() => {
    const finishEmailLinkSignIn = async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        return
      }

      setProcessingLink(true)

      try {
        let emailForSignIn = window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY) || ''

        if (!emailForSignIn) {
          setPendingEmailLink(window.location.href)
          setMessage('Pro dokončení přihlášení z odkazu zadejte svůj e-mail níže.')
          return
        }

        setMessage('Dokončuji přihlášení z odkazu...')
        await signInWithEmailLink(auth, emailForSignIn, window.location.href)
        window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY)
        setPendingEmailLink('')

        if (onLoginSuccess) {
          onLoginSuccess()
        }

        navigate('/')
      } catch (error) {
        console.error('Chyba při přihlášení přes odkaz:', error)
        setMessage('Přihlášení přes odkaz se nepodařilo dokončit. Požádejte o nový odkaz.')
      } finally {
        setProcessingLink(false)
      }
    }

    finishEmailLinkSignIn()
  }, [navigate, onLoginSuccess])

  const completePendingEmailLinkSignIn = async (emailForSignIn) => {
    if (!pendingEmailLink) {
      return
    }

    if (!emailForSignIn.trim()) {
      setMessage('Pro dokončení přihlášení zadejte svůj e-mail.')
      return
    }

    setProcessingLink(true)
    setMessage('Dokončuji přihlášení z odkazu...')

    try {
      await signInWithEmailLink(auth, emailForSignIn.trim(), pendingEmailLink)
      window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY)
      setPendingEmailLink('')

      if (onLoginSuccess) {
        onLoginSuccess()
      }

      navigate('/')
    } catch (error) {
      console.error('Chyba při dokončení přihlášení přes odkaz:', error)
      setMessage('Přihlášení přes odkaz se nepodařilo dokončit. Požádejte o nový odkaz.')
    } finally {
      setProcessingLink(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage('')
    setUserForVerification(null)

    if (pendingEmailLink) {
      await completePendingEmailLinkSignIn(email)
      return
    }

    if (loginMethod === 'emailLink') {
      await handleSendLoginLink()
      return
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      if (!user.emailVerified) {
        setUserForVerification(user) // Uložíme uživatele pro možnost znovu odeslat ověření
        setMessage(
          <>
            <p>Váš e-mail není ověřen! Zkontrolujte svou e-mailovou schránku.</p>
            <CButton color="link" size="sm" onClick={() => resendVerificationEmail(user)}>
              Znovu odeslat ověřovací e-mail
            </CButton>
          </>,
        )
        return
      }

      if (onLoginSuccess) {
        onLoginSuccess()
      }
      navigate('/')
    } catch (error) {
      console.error(error)
      setMessage('Chyba přihlášení. Prosím, zkontrolujte email a heslo.')
    }
  }

  const handleSendLoginLink = async () => {
    if (!email.trim()) {
      setMessage('Nejprve zadejte svůj e-mail.')
      return
    }

    setSendingLink(true)
    setMessage('')
    setUserForVerification(null)

    try {
      await sendSignInLinkToEmail(auth, email.trim(), getEmailLinkActionCodeSettings())
      window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email.trim())
      setMessage('Přihlašovací odkaz byl odeslán do e-mailu. Otevřete ho na tomto zařízení.')
    } catch (error) {
      console.error('Chyba při odeslání přihlašovacího odkazu:', error)
      setMessage(
        'Nepodařilo se odeslat přihlašovací odkaz. Zkontrolujte nastavení Firebase a domény.',
      )
    } finally {
      setSendingLink(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setMessage('Nejprve zadejte e-mail, ke kterému chcete obnovit heslo.')
      return
    }

    setSendingPasswordReset(true)
    setMessage('')

    try {
      await sendPasswordResetEmail(auth, email.trim())
      setMessage(
        'Pokud je tento e-mail v systému registrovaný, poslali jsme na něj odkaz pro nastavení nového hesla.',
      )
    } catch (error) {
      console.error('Chyba při odesílání odkazu pro obnovu hesla:', error)
      setMessage('Odkaz pro obnovu hesla se nepodařilo odeslat. Zkuste to prosím znovu.')
    } finally {
      setSendingPasswordReset(false)
    }
  }

  const selectLoginMethod = (method) => {
    setLoginMethod(method)
    setMessage('')
    setUserForVerification(null)
  }

  const resendVerificationEmail = async (user) => {
    try {
      await sendEmailVerification(user)
      setMessage('Ověřovací e-mail byl znovu odeslán.')
    } catch (error) {
      console.error('Chyba při odesílání ověřovacího e-mailu:', error)
      setMessage('Chyba při odesílání ověřovacího e-mailu. Zkuste to znovu.')
    }
  }

  return (
    <div className="login-page">
      <img src={logo} alt="Logo" className="login-logo" />
      <CContainer className="d-flex flex-column justify-content-center align-items-center min-vh-100">
        <CRow className="justify-content-center w-100">
          <CCol md={6} lg={5}>
            <CCard className="p-4 shadow-lg login-card">
              <CCardBody>
                <CForm onSubmit={handleLogin}>
                  <h1>Přihlášení</h1>
                  <p className="text-body-secondary login-intro">
                    Použijte e-mail, kterým komunikujete s naší společností.
                  </p>

                  {!pendingEmailLink ? (
                    <div
                      className="login-method-switch"
                      role="group"
                      aria-label="Způsob přihlášení"
                    >
                      <button
                        type="button"
                        className={loginMethod === 'password' ? 'active' : ''}
                        aria-pressed={loginMethod === 'password'}
                        onClick={() => selectLoginMethod('password')}
                      >
                        S heslem
                      </button>
                      <button
                        type="button"
                        className={loginMethod === 'emailLink' ? 'active' : ''}
                        aria-pressed={loginMethod === 'emailLink'}
                        onClick={() => selectLoginMethod('emailLink')}
                      >
                        Odkazem do e-mailu
                      </button>
                    </div>
                  ) : null}

                  <p className="login-method-description" aria-live="polite">
                    {pendingEmailLink
                      ? 'Pro dokončení přihlášení potvrďte e-mail, na který odkaz přišel.'
                      : loginMethod === 'password'
                        ? 'Zadejte své heslo a přihlaste se obvyklým způsobem.'
                        : 'Pošleme vám jednorázový přihlašovací odkaz. Heslo nepotřebujete.'}
                  </p>

                  {/* Zobrazení hlášek přímo v UI */}
                  {message && <CAlert color="info">{message}</CAlert>}

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </CInputGroup>

                  {!pendingEmailLink && loginMethod === 'password' ? (
                    <div className="login-method-panel" key="password">
                      <CInputGroup>
                        <CInputGroupText>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>
                        <CFormInput
                          type="password"
                          placeholder="Heslo"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </CInputGroup>
                      <div className="text-end mb-3">
                        <CButton
                          type="button"
                          color="link"
                          className="login-forgot-password"
                          onClick={handlePasswordReset}
                          disabled={sendingPasswordReset}
                        >
                          {sendingPasswordReset ? 'Odesílám odkaz...' : 'Zapomněli jste heslo?'}
                        </CButton>
                      </div>
                    </div>
                  ) : !pendingEmailLink ? (
                    <div className="login-method-panel login-link-note" key="emailLink">
                      Odkaz bude platný omezenou dobu a lze ho použít pouze k přihlášení.
                    </div>
                  ) : null}

                  <CButton
                    type="submit"
                    color="primary"
                    className="w-100 login-submit"
                    disabled={processingLink || sendingLink}
                  >
                    {pendingEmailLink
                      ? processingLink
                        ? 'Dokončuji přihlášení...'
                        : 'Dokončit přihlášení odkazem'
                      : loginMethod === 'emailLink'
                        ? sendingLink
                          ? 'Odesílám odkaz...'
                          : 'Poslat přihlašovací odkaz'
                        : 'Přihlásit se'}
                  </CButton>

                  <div className="login-registration text-center">
                    Nemáte ještě účet? <Link to="/register">Zaregistrovat se</Link>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

Login.propTypes = {
  onLoginSuccess: PropTypes.func,
}

export default Login

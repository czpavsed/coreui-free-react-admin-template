import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilLockLocked, cilUser } from "@coreui/icons";
import { auth } from "../../../firebaseConfig";
import {
  isSignInWithEmailLink,
  sendEmailVerification,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
} from "firebase/auth";
import logo from "src/assets/images/Logo.png";

const EMAIL_LINK_STORAGE_KEY = "derator.emailForSignIn";

function getEmailLinkActionCodeSettings() {
  const origin = window.location.origin;
  const path = window.location.pathname || "/";

  return {
    url: `${origin}${path}#/login`,
    handleCodeInApp: true,
  };
}

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); // Pro ukládání UI hlášek
  const [userForVerification, setUserForVerification] = useState(null);
  const [sendingLink, setSendingLink] = useState(false);
  const [processingLink, setProcessingLink] = useState(false);
  const [authMode, setAuthMode] = useState("password");
  const [pendingEmailLink, setPendingEmailLink] = useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    const finishEmailLinkSignIn = async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        return;
      }

      setProcessingLink(true);
      setAuthMode("emailLink");

      try {
        let emailForSignIn = window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY) || "";

        if (!emailForSignIn) {
          setPendingEmailLink(window.location.href);
          setMessage("Pro dokončení přihlášení z odkazu zadejte svůj e-mail níže.");
          return;
        }

        setMessage("Dokončuji přihlášení z odkazu...");
        await signInWithEmailLink(auth, emailForSignIn, window.location.href);
        window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
        setPendingEmailLink("");

        if (onLoginSuccess) {
          onLoginSuccess();
        }

        navigate("/");
      } catch (error) {
        console.error("Chyba při přihlášení přes odkaz:", error);
        setMessage("Přihlášení přes odkaz se nepodařilo dokončit. Požádejte o nový odkaz.");
      } finally {
        setProcessingLink(false);
      }
    };

    finishEmailLinkSignIn();
  }, [navigate, onLoginSuccess]);

  const completePendingEmailLinkSignIn = async (emailForSignIn) => {
    if (!pendingEmailLink) {
      return;
    }

    if (!emailForSignIn.trim()) {
      setMessage("Pro dokončení přihlášení zadejte svůj e-mail.");
      return;
    }

    setProcessingLink(true);
    setMessage("Dokončuji přihlášení z odkazu...");

    try {
      await signInWithEmailLink(auth, emailForSignIn.trim(), pendingEmailLink);
      window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
      setPendingEmailLink("");

      if (onLoginSuccess) {
        onLoginSuccess();
      }

      navigate("/");
    } catch (error) {
      console.error("Chyba při dokončení přihlášení přes odkaz:", error);
      setMessage("Přihlášení přes odkaz se nepodařilo dokončit. Požádejte o nový odkaz.");
    } finally {
      setProcessingLink(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setUserForVerification(null);

    if (pendingEmailLink) {
      await completePendingEmailLinkSignIn(email);
      return;
    }

    if (authMode === "emailLink") {
      await handleSendLoginLink();
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setUserForVerification(user); // Uložíme uživatele pro možnost znovu odeslat ověření
        setMessage(
          <>
            <p>Váš e-mail není ověřen! Zkontrolujte svou e-mailovou schránku.</p>
            <CButton color="link" size="sm" onClick={() => resendVerificationEmail(user)}>
              Znovu odeslat ověřovací e-mail
            </CButton>
          </>
        );
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      }
      navigate("/");
    } catch (error) {
      console.error(error);
      setMessage("Chyba přihlášení. Prosím, zkontrolujte email a heslo.");
    }
  };

  const handleSendLoginLink = async () => {
    if (!email.trim()) {
      setMessage("Nejprve zadejte svůj e-mail.");
      return;
    }

    setAuthMode("emailLink");
    setSendingLink(true);
    setMessage("");
    setUserForVerification(null);

    try {
      await sendSignInLinkToEmail(auth, email.trim(), getEmailLinkActionCodeSettings());
      window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email.trim());
      setMessage("Přihlašovací odkaz byl odeslán do e-mailu. Otevřete ho na tomto zařízení.");
    } catch (error) {
      console.error("Chyba při odeslání přihlašovacího odkazu:", error);
      setMessage("Nepodařilo se odeslat přihlašovací odkaz. Zkontrolujte nastavení Firebase a domény.");
    } finally {
      setSendingLink(false);
    }
  };

  const resendVerificationEmail = async (user) => {
    try {
      await sendEmailVerification(user);
      setMessage("Ověřovací e-mail byl znovu odeslán.");
    } catch (error) {
      console.error("Chyba při odesílání ověřovacího e-mailu:", error);
      setMessage("Chyba při odesílání ověřovacího e-mailu. Zkuste to znovu.");
    }
  };

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
                  <p className="text-body-secondary">Přihlašte se prosím.</p>

                  <div className="d-grid gap-2 mb-3">
                    <CButton
                      type="button"
                      color={authMode === "password" ? "primary" : "secondary"}
                      variant={authMode === "password" ? undefined : "outline"}
                      onClick={() => setAuthMode("password")}
                      disabled={processingLink}
                    >
                      Přihlásit heslem
                    </CButton>
                    <CButton
                      type="button"
                      color={authMode === "emailLink" ? "primary" : "secondary"}
                      variant={authMode === "emailLink" ? undefined : "outline"}
                      onClick={() => setAuthMode("emailLink")}
                      disabled={processingLink}
                    >
                      Přihlásit odkazem
                    </CButton>
                  </div>

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
                    />
                  </CInputGroup>

                  {authMode === "password" && !pendingEmailLink ? (
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Heslo"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </CInputGroup>
                  ) : null}

                  <CButton type="submit" color="primary" className="w-100" disabled={processingLink}>
                    {pendingEmailLink
                      ? processingLink
                        ? "Dokončuji přihlášení..."
                        : "Dokončit přihlášení odkazem"
                      : authMode === "password"
                        ? "Přihlásit"
                        : "Poslat přihlašovací odkaz"}
                  </CButton>

                  {authMode === "emailLink" && !pendingEmailLink ? (
                    <CButton
                      type="button"
                      color="primary"
                      className="w-100 mt-3"
                      onClick={handleSendLoginLink}
                      disabled={sendingLink || processingLink}
                    >
                      {sendingLink ? "Odesílám odkaz..." : "Poslat přihlašovací odkaz"}
                    </CButton>
                  ) : null}

                  {authMode === "emailLink" && !pendingEmailLink ? (
                    <div className="mt-2 px-2 text-center text-body-secondary small">
                      Pokud nechcete zadávat heslo, nechte si poslat jednorázový odkaz do e-mailu.
                    </div>
                  ) : null}

                  <div className="mt-4 text-center">
                    <p>
                      V případě, že nemáte registraci do našeho systému, zaregistrujte se prosím
                      emailem, kterým s námi komunikujete. <Link to="/register">Registrovat</Link>
                    </p>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Login;

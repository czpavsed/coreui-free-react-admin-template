import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  CAlert, // ✅ Přidáváme pro chybové zprávy
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilLockLocked, cilUser } from "@coreui/icons";
import { auth } from "../../../firebaseConfig";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import logo from "src/assets/images/Logo.png";

const Register = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // ✅ Chybová zpráva
  const [successMessage, setSuccessMessage] = useState(""); // ✅ Úspěšná zpráva
  const navigate = useNavigate();

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!isValidEmail(email)) {
      setErrorMessage("Zadejte platný e-mail!");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Hesla se neshodují!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await sendEmailVerification(user);

      setSuccessMessage("Byl vám odeslán ověřovací e-mail. Před přihlášením jej potvrďte.");
      
      // ✅ Automatické přesměrování na přihlášení po 5 sekundách
      setTimeout(() => {
        navigate("/login");
      }, 5000);
      
    } catch (error) {
      console.error("Chyba při registraci:", error);
      setErrorMessage("Chyba při vytváření účtu. Zkontrolujte zadané údaje.");
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
                <CForm onSubmit={handleRegister}>
                  <h1>Registrace</h1>
                  <p className="text-body-secondary">Vytvořte si účet.</p>

                  {/* 🔹 Chybová a úspěšná zpráva */}
                  {errorMessage && <CAlert color="danger">{errorMessage}</CAlert>}
                  {successMessage && <CAlert color="success">{successMessage}</CAlert>}

                  {/* JMÉNO */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      placeholder="Jméno a příjmení"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </CInputGroup>

                  {/* EMAIL */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>@</CInputGroupText>
                    <CFormInput
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </CInputGroup>

                  {/* HESLO */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Heslo"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6} // ✅ Minimální délka hesla
                      required
                    />
                  </CInputGroup>

                  {/* OPAKOVÁNÍ HESLA */}
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type="password"
                      placeholder="Zopakujte heslo"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </CInputGroup>

                  <div className="d-grid">
                    <CButton type="submit" color="success">
                      Vytvořit účet
                    </CButton>
                  </div>

                  <div className="mt-4 text-center">
                    <p>Máte již účet? <Link to="/login">Přihlásit se</Link></p>
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

export default Register;

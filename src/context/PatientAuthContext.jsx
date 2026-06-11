import { createContext, useContext, useState, useEffect } from "react";
import { patientAuthApi } from "../services/patientAuthApi";

const PatientAuthContext = createContext();

export const usePatientAuth = () => useContext(PatientAuthContext);

export const PatientAuthProvider = ({ children }) => {
    const [patientUser, setPatientUser] = useState(null);
    const [patientToken, setPatientToken] = useState(localStorage.getItem("patientToken"));
    const [isPatientAuthenticated, setIsPatientAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            setLoading(true);
            if (patientToken) {
                try {
                    const profileData = await patientAuthApi.getMe();
                    setPatientUser(profileData);
                    setIsPatientAuthenticated(true);
                } catch (err) {
                    console.error("Patient Token Error:", err);
                    logoutPatient(); // Invalid token
                }
            } else {
                setPatientUser(null);
                setIsPatientAuthenticated(false);
            }
            setLoading(false);
        };
        checkAuth();
    }, [patientToken]);

    const registerPatient = async (patientData) => {
        try {
            const data = await patientAuthApi.register(patientData);
            if (data.token) {
                localStorage.setItem("patientToken", data.token);
                setPatientToken(data.token);
                setPatientUser(data.patient);
                setIsPatientAuthenticated(true);
            }
            return data.patient;
        } catch (err) {
            throw err;
        }
    };

    const loginPatient = async (tcOrEmail, password) => {
        try {
            const data = await patientAuthApi.login(tcOrEmail, password);
            if (data.token) {
                localStorage.setItem("patientToken", data.token);
                setPatientToken(data.token);
                setPatientUser(data.patient);
                setIsPatientAuthenticated(true);
            }
            return data.patient;
        } catch (err) {
            throw err;
        }
    };

    const logoutPatient = () => {
        localStorage.removeItem("patientToken");
        setPatientToken(null);
        setPatientUser(null);
        setIsPatientAuthenticated(false);
    };

    const refreshUser = async () => {
        try {
            const profileData = await patientAuthApi.getMe();
            setPatientUser(profileData);
        } catch (err) {
            console.error("Refresh user error:", err);
        }
    };

    return (
        <PatientAuthContext.Provider value={{
            patientUser,
            patientToken,
            isPatientAuthenticated,
            loading,
            registerPatient,
            loginPatient,
            logoutPatient,
            refreshUser,
            checkTC: patientAuthApi.checkTC
        }}>
            {children}
        </PatientAuthContext.Provider>
    );
};

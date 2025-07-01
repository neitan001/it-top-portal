import React, { createContext, useContext, useState, useCallback } from "react";

const CoreAlertContext = createContext();

export const CoreAlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((options) => {
    setAlert({ ...options, open: true });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert((prev) => (prev ? { ...prev, open: false } : null));
  }, []);

  return (
    <CoreAlertContext.Provider value={{ alert, showAlert, closeAlert }}>
      {children}
    </CoreAlertContext.Provider>
  );
};

export const useCoreAlert = () => useContext(CoreAlertContext); 
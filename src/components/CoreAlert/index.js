import React from "react";
import { CoreAlertProvider, useCoreAlert } from "./CoreAlertContext";
import CoreAlert from "./CoreAlert";


let showAlertGlobal;
let closeAlertGlobal;

export function coreAlert(options) {
  if (showAlertGlobal) {
    showAlertGlobal(options);
  } else {
    console.warn("CoreAlertProvider не инициализирован");
  }
}

coreAlert.close = function() {
  if (closeAlertGlobal) {
    closeAlertGlobal();
  } else {
    console.warn("CoreAlertProvider не инициализирован");
  }
};

export function CoreAlertRoot({ children }) {
  return (
    <CoreAlertProvider>
      <CoreAlertRegister />
      <CoreAlert />
      {children}
    </CoreAlertProvider>
  );
}

function CoreAlertRegister() {
  const { showAlert, closeAlert } = useCoreAlert();
  React.useEffect(() => {
    showAlertGlobal = showAlert;
    closeAlertGlobal = closeAlert;
    return () => {
      showAlertGlobal = null;
      closeAlertGlobal = null;
    };
  }, [showAlert, closeAlert]);
  return null;
}
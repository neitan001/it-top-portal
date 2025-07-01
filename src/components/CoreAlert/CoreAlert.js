import React, { useEffect, useState, useCallback } from "react";
import { useCoreAlert } from "./CoreAlertContext";
import styles from "./CoreAlert.module.css";

const typeStyles = {
  success: styles["corealert-success"],
  warning: styles["corealert-warning"],
  error: styles["corealert-error"],
  info: styles["corealert-info"],
};

export default function CoreAlert() {
  const { alert, closeAlert } = useCoreAlert();
  const [hiding, setHiding] = useState(false);

  const handleClose = useCallback(() => {
    setHiding(true);
    setTimeout(() => {
      setHiding(false);
      closeAlert();
    }, 200);
  }, [closeAlert]);

  useEffect(() => {
    if (alert?.timer && alert.open) {
      const timer = setTimeout(() => {
        handleClose();
      }, alert.timer);
      return () => clearTimeout(timer);
    }
  }, [alert, handleClose]);

  useEffect(() => {
    if (alert?.open) setHiding(false);
  }, [alert?.open]);

  if (!alert?.open && !hiding) return null;

  return (
    <div className={styles["corealert-overlay"]}>
      <div
        className={
          styles["corealert-box"] +
          ` ${typeStyles[alert.type] || typeStyles.info}` +
          (hiding ? ` ${styles["corealert-box--hide"]}` : "")
        }
      >
        <div className={styles["corealert-content"]}>
          {alert.title && <div className={styles["corealert-title"]}>{alert.title}</div>}
          {alert.subtitle && <div className={styles["corealert-subtitle"]}>{alert.subtitle}</div>}
          {alert.loader && (
            <div className={styles["corealert-loader"]}>
              <div className={styles["corealert-loader-spinner"]} />
            </div>
          )}
        </div>
        <div className={styles["corealert-actions"]}>
          {alert.cancelButton?.show && (
            <button
              className={styles["corealert-cancel-button"]}
              onClick={() => {
                alert.cancelButton.onClick?.();
                handleClose();
              }}
            >
              {alert.cancelButton.displayText || "Отмена"}
            </button>
          )}
          {alert.successButton?.show && (
            <button
              className={styles["corealert-success-button"]}
              onClick={() => {
                alert.successButton.onClick?.();
                handleClose();
              }}
            >
              {alert.successButton.displayText || "ОК"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 
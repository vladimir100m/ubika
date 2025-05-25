import React, { useEffect, useState } from 'react';
import styles from '../styles/MobileUtils.module.css';

interface ToastProps {
  message: string;
  duration?: number;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  duration = 3000, 
  type = 'info',
  onClose
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) {
        onClose();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return styles.toastSuccess;
      case 'error':
        return styles.toastError;
      default:
        return styles.toastInfo;
    }
  };

  return (
    <div className={`${styles.toast} ${getTypeClass()} ${visible ? styles.visible : ''}`}>
      {message}
    </div>
  );
};

export default Toast;
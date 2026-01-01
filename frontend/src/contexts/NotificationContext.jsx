import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: null
    });

    const showNotification = useCallback((config) => {
        setModalConfig({
            isOpen: true,
            title: config.title || 'Notification',
            message: config.message || '',
            type: config.type || 'info',
            confirmText: config.confirmText || 'OK',
            cancelText: config.cancelText || 'Cancel',
            onConfirm: config.onConfirm || null
        });
    }, []);

    const closeNotification = useCallback(() => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    }, []);

    const handleConfirm = useCallback(() => {
        if (modalConfig.onConfirm) {
            modalConfig.onConfirm();
        }
        closeNotification();
    }, [modalConfig, closeNotification]);

    const alert = useCallback((message, title = 'Alert', type = 'info') => {
        showNotification({ message, title, type, onConfirm: null });
    }, [showNotification]);

    const confirm = useCallback((message, onConfirm, title = 'Confirm', type = 'warning') => {
        showNotification({ message, title, type, onConfirm, confirmText: 'Confirm', cancelText: 'Cancel' });
    }, [showNotification]);

    return (
        <NotificationContext.Provider value={{ alert, confirm, showNotification, closeNotification }}>
            {children}
            <ConfirmModal
                {...modalConfig}
                onClose={closeNotification}
                onConfirm={modalConfig.onConfirm ? handleConfirm : null}
            />
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

import React from 'react';
import Modal from './Modal';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info' // 'info', 'warning', 'danger', 'success'
}) {
    const getIcon = () => {
        switch (type) {
            case 'danger': return '⚠️';
            case 'warning': return '🔔';
            case 'success': return '✅';
            default: return 'ℹ️';
        }
    };

    const getConfirmClass = () => {
        switch (type) {
            case 'danger': return 'btn-danger';
            case 'success': return 'btn-success';
            default: return 'btn-primary';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="confirm-modal-content">
                <div className={`confirm-icon ${type}`}>
                    {getIcon()}
                </div>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    {onConfirm && (
                        <button onClick={onConfirm} className={getConfirmClass()}>
                            {confirmText}
                        </button>
                    )}
                    <button onClick={onClose} className="btn-secondary">
                        {onConfirm ? cancelText : 'Close'}
                    </button>
                </div>
            </div>

            <style>{`
                .confirm-modal-content {
                    text-align: center;
                    padding: 1rem 0;
                }
                .confirm-icon {
                    font-size: 3rem;
                    margin-bottom: 1.5rem;
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    margin-left: auto;
                    margin-right: auto;
                }
                .confirm-icon.info { background: #eff6ff; }
                .confirm-icon.warning { background: #fffbeb; }
                .confirm-icon.danger { background: #fef2f2; }
                .confirm-icon.success { background: #f0fdf4; }
                
                .confirm-message {
                    font-size: 1.125rem;
                    color: var(--text);
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }
                .confirm-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }
                .confirm-actions button {
                    min-width: 120px;
                    padding: 0.75rem 1.5rem;
                }
            `}</style>
        </Modal>
    );
}

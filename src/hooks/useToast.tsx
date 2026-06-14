import {createContext, useCallback, useContext, useState, type ReactNode} from 'react';

interface Toast {
    id: number;
    message: string;
    type: 'error' | 'success' | 'info';
}

interface ToastContextValue {
    toast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({children}: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: Toast['type'] = 'error') => {
        const id = nextId++;
        setToasts(prev => [...prev, {id, message, type}]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 6000);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{toast: addToast}}>
            {children}
            {/* Toast container */}
            {toasts.length > 0 && (
                <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
                    {toasts.map(t => (
                        <div
                            key={t.id}
                            className={`glass flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm animate-in slide-in-from-right fade-in duration-200 ${
                                t.type === 'error'
                                    ? 'border-destructive/40 text-destructive'
                                    : t.type === 'success'
                                        ? 'border-status-completed/40 text-status-completed'
                                        : 'border-border text-foreground'
                            }`}
                        >
                            <span className="flex-1">{t.message}</span>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

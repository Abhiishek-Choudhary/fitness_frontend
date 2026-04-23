import { createContext, useCallback, useContext, useReducer } from 'react';

const ToastContext = createContext(null);

const reducer = (state, action) => {
  switch (action.type) {
    case 'ADD':
      return [...state, action.toast];
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = nextId++;
    dispatch({ type: 'ADD', toast: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE', id }), duration);
  }, []);

  const dismiss = useCallback((id) => dispatch({ type: 'REMOVE', id }), []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx.showToast;
}

/* ── Toast container + individual toast ── */

const STYLES = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  error:   'border-red-500/40 bg-red-500/10 text-red-300',
  info:    'border-violet-500/40 bg-violet-500/10 text-violet-300',
  warning: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
};

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
};

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg backdrop-blur-sm animate-slide-up max-w-xs ${STYLES[t.type] ?? STYLES.info}`}
        >
          <span className="text-base leading-none">{ICONS[t.type]}</span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="opacity-50 hover:opacity-100 transition-opacity ml-1 text-base leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

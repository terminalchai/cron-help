import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, X as CloseIcon } from 'lucide-react'

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [toast, onClose])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 999,
        pointerEvents: 'none',
      }}>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 8,  scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 24 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.75rem 1rem',
              background: 'var(--surface)',
              border: `1px solid ${toast.type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
              borderRadius: '0.75rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              pointerEvents: 'all',
              maxWidth: 320,
            }}
          >
            {toast.type === 'error'
              ? <XCircle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
              : <CheckCircle2 size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
            }
            <span style={{ fontSize: '0.85rem', color: 'var(--text)', flex: 1 }}>
              {toast.message}
            </span>
            <button
              onClick={onClose}
              aria-label="Dismiss notification"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)', padding: '0.125rem', display: 'flex' }}
            >
              <CloseIcon size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useState, useEffect } from 'react';

const PAYMENT_METHODS = ['Efectivo', 'QR'];

export default function SplitPayment({ total, onPaymentsChange }) {
  const [payments, setPayments] = useState([
    { method: 'Efectivo', amount: '' }
  ]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (total > 0) {
      setPayments(prev => {
        if (prev.length === 1) {
          return [{ ...prev[0], amount: total.toFixed(2) }];
        }
        return prev;
      });
    }
  }, [total]);

  useEffect(() => {
    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    if (payments.length > 0 && totalPaid > 0) {
      onPaymentsChange(
        payments
          .filter(p => parseFloat(p.amount) > 0)
          .map(p => ({ payment_method: p.method, amount: parseFloat(p.amount) }))
      );
    }
  }, [payments]);

  const updatePayment = (index, field, value) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    setPayments(updated);

    const totalPaid = updated.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    if (totalPaid > total) {
      setError('Excede el total');
    } else {
      setError('');
    }
  };

  const addPayment = () => {
    if (payments.length >= 3) return;
    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const remaining = Math.max(0, total - totalPaid);
    const usedMethods = payments.map(p => p.method);
    const nextMethod = PAYMENT_METHODS.find(m => !usedMethods.includes(m)) || 'Efectivo';
    setPayments([...payments, { method: nextMethod, amount: remaining > 0 ? remaining.toFixed(2) : '' }]);
  };

  const removePayment = (index) => {
    if (payments.length <= 1) return;
    const updated = payments.filter((_, i) => i !== index);
    setPayments(updated);
  };

  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const remaining = total - totalPaid;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <label className="form-label mb-0" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Metodo de pago
        </label>
        <button
          className="btn btn-sm p-0"
          style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600 }}
          onClick={addPayment}
          disabled={payments.length >= 3}
        >
          <i className="bi bi-plus-circle me-1"></i>Agregar metodo
        </button>
      </div>

      {payments.map((payment, index) => (
        <div key={index} className="d-flex gap-2 mb-2 align-items-center">
          <div className="d-flex gap-1 flex-grow-1">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method}
                className={`btn flex-grow-1 py-1 ${payment.method === method ? 'btn-accent' : ''}`}
                style={{
                  fontSize: '0.75rem',
                  borderRadius: '8px',
                  ...(payment.method === method ? {} : {
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)'
                  })
                }}
                onClick={() => updatePayment(index, 'method', method)}
              >
                <i className={`bi ${method === 'Efectivo' ? 'bi-cash' : 'bi-qr-code'} me-1`}></i>
                {method}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', width: '100px' }}>
            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Bs.</span>
            <input
              type="number"
              className="form-control form-control-sm"
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                paddingLeft: '32px',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
              min="0"
              step="0.01"
              value={payment.amount}
              onChange={(e) => updatePayment(index, 'amount', e.target.value)}
            />
          </div>
          {payments.length > 1 && (
            <button
              className="btn btn-sm p-0"
              style={{ color: 'var(--danger)', fontSize: '1rem' }}
              onClick={() => removePayment(index)}
            >
              <i className="bi bi-x-circle"></i>
            </button>
          )}
        </div>
      ))}

      {payments.length > 1 && (
        <div className="d-flex justify-content-between mt-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total pagado</span>
          <span style={{
            fontWeight: 700,
            fontSize: '0.85rem',
            color: remaining <= 0 ? 'var(--success)' : 'var(--text-primary)'
          }}>
            Bs. {totalPaid.toFixed(2)}
          </span>
        </div>
      )}

      {remaining < -0.01 && (
        <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px' }}>
          <i className="bi bi-exclamation-circle me-1"></i>Excede el total por Bs. {Math.abs(remaining).toFixed(2)}
        </div>
      )}

      {payments.length > 1 && remaining > 0.01 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
          Falta por pagar: Bs. {remaining.toFixed(2)}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import reportService from '../services/reportService';

const fmt = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const weekBucket = (d) => {
  const day = d.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 8;
  if (day <= 21) return 15;
  return 22;
};

const thisWeekRange = (today) => ({
  start: fmt(new Date(today.getFullYear(), today.getMonth(), weekBucket(today))),
  end: fmt(today)
});

const lastWeekRange = (today) => {
  const y = today.getFullYear();
  const m = today.getMonth();
  const bucket = weekBucket(today);
  if (bucket === 1) {
    const pm = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);
    return {
      start: fmt(new Date(pm.getFullYear(), pm.getMonth(), weekBucket(lastDay))),
      end: fmt(lastDay)
    };
  }
  const prevBucket = { 8: 1, 15: 8, 22: 15 }[bucket];
  return {
    start: fmt(new Date(y, m, prevBucket)),
    end: fmt(new Date(y, m, prevBucket + 6))
  };
};

const thisMonthRange = (today) => ({
  start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
  end: fmt(today)
});

const lastMonthRange = (today) => ({
  start: fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
  end: fmt(new Date(today.getFullYear(), today.getMonth(), 0))
});

const fmtLabel = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [topProducts, setTopProducts] = useState([]);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [periodSummary, setPeriodSummary] = useState(null);
  const [periodLabel, setPeriodLabel] = useState('');
  const [activePreset, setActivePreset] = useState(null);
  const [loadingPeriod, setLoadingPeriod] = useState(false);

  useEffect(() => {
    loadDailyReport();
  }, []);

  useEffect(() => {
    loadDailyReport();
  }, [selectedDate]);

  const loadDailyReport = async () => {
    setLoading(true);
    try {
      const [dailyReport, topProductsData] = await Promise.all([
        reportService.getDailyReport(selectedDate),
        reportService.getTopProducts(selectedDate, 10)
      ]);
      setReport(dailyReport);
      setTopProducts(topProductsData);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPeriodReport = async (label = '', preset = null, startOverride, endOverride) => {
    const start = startOverride || periodStart;
    const end = endOverride || periodEnd;
    if (!start || !end) {
      alert('Selecciona las fechas de inicio y fin');
      return;
    }
    setPeriodLabel(label);
    setActivePreset(preset);
    setLoadingPeriod(true);
    try {
      const data = await reportService.getPeriodReport(start, end);
      setPeriodSummary(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingPeriod(false);
    }
  };

  const applyPreset = (preset) => {
    const today = new Date();
    let range, label;
    if (preset === 'this_week') {
      range = thisWeekRange(today);
      label = `Esta Semana (${fmtLabel(range.start)} - ${fmtLabel(range.end)})`;
    } else if (preset === 'last_week') {
      range = lastWeekRange(today);
      label = `Semana Pasada (${fmtLabel(range.start)} - ${fmtLabel(range.end)})`;
    } else if (preset === 'this_month') {
      range = thisMonthRange(today);
      label = `Este Mes (${fmtLabel(range.start)} - ${fmtLabel(range.end)})`;
    } else if (preset === 'last_month') {
      range = lastMonthRange(today);
      label = `Mes Pasado (${fmtLabel(range.start)} - ${fmtLabel(range.end)})`;
    }
    setPeriodStart(range.start);
    setPeriodEnd(range.end);
    loadPeriodReport(label, preset, range.start, range.end);
  };

  const formatCurrency = (amount) => `Bs. ${Number(amount || 0).toFixed(2)}`;

  if (loading && !report) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" style={{ color: 'var(--accent)' }} role="status"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 style={{ fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Reportes</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Analisis de ventas y rendimiento</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fecha:</label>
          <div className="btn-group" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button
              className="btn btn-sm"
              style={{ backgroundColor: selectedDate === fmt(new Date()) ? 'var(--accent)' : 'var(--bg-input)', color: selectedDate === fmt(new Date()) ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 600 }}
              onClick={() => setSelectedDate(fmt(new Date()))}
            >
              Hoy
            </button>
            <button
              className="btn btn-sm"
              style={{ backgroundColor: selectedDate === fmt(new Date(Date.now() - 86400000)) ? 'var(--accent)' : 'var(--bg-input)', color: selectedDate === fmt(new Date(Date.now() - 86400000)) ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 600 }}
              onClick={() => setSelectedDate(fmt(new Date(Date.now() - 86400000)))}
            >
              Ayer
            </button>
          </div>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: '170px', fontSize: '0.9rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Stats del dia */}
      {report && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-lg-3">
              <div className="stat-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '1.25rem' }}>
                <div className="stat-icon mb-2" style={{ backgroundColor: 'rgba(233, 69, 96, 0.15)', color: 'var(--accent)' }}>
                  <i className="bi bi-receipt"></i>
                </div>
                <div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--accent)' }}>
                  {report.stats.total_sales}
                </div>
                <div className="stat-label" style={{ color: 'var(--text-secondary)' }}>Ventas</div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="stat-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '1.25rem' }}>
                <div className="stat-icon mb-2" style={{ backgroundColor: 'rgba(15, 155, 88, 0.15)', color: 'var(--success)' }}>
                  <i className="bi bi-cash-stack"></i>
                </div>
                <div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--success)' }}>
                  {formatCurrency(report.stats.total_revenue)}
                </div>
                <div className="stat-label" style={{ color: 'var(--text-secondary)' }}>Ingresos</div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="stat-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '1.25rem' }}>
                <div className="stat-icon mb-2" style={{ backgroundColor: 'rgba(15, 155, 88, 0.15)', color: 'var(--success)' }}>
                  <i className="bi bi-cash"></i>
                </div>
                <div className="stat-value" style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                  {formatCurrency(report.stats.cash_total)}
                </div>
                <div className="stat-label" style={{ color: 'var(--text-secondary)' }}>Efectivo</div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="stat-card" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: '1.25rem' }}>
                <div className="stat-icon mb-2" style={{ backgroundColor: 'rgba(52, 152, 219, 0.15)', color: '#3498db' }}>
                  <i className="bi bi-qr-code"></i>
                </div>
                <div className="stat-value" style={{ fontSize: '1.4rem', color: '#3498db' }}>
                  {formatCurrency(report.stats.qr_total)}
                </div>
                <div className="stat-label" style={{ color: 'var(--text-secondary)' }}>QR</div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Top Productos */}
            <div className="col-lg-5">
              <div className="h-100" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div className="p-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <h6 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    <i className="bi bi-trophy me-2" style={{ color: 'var(--warning)' }}></i>
                    Top Productos
                  </h6>
                </div>
                <div className="p-3">
                  {topProducts.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>Sin datos para esta fecha</p>
                  ) : (
                    topProducts.map((prod, idx) => (
                      <div
                        key={idx}
                        className="d-flex justify-content-between align-items-center py-2"
                        style={{ borderBottom: idx < topProducts.length - 1 ? '1px solid var(--border-light)' : 'none' }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '8px',
                              backgroundColor: idx < 3 ? 'rgba(233, 69, 96, 0.15)' : 'var(--bg-input)',
                              color: idx < 3 ? 'var(--accent)' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{prod.product_name}</span>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>x{prod.total_quantity}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{formatCurrency(prod.total_revenue)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Detalle Ventas del dia */}
            <div className="col-lg-7">
              <div className="h-100" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div className="p-3 d-flex align-items-center justify-content-between" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <h6 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    <i className="bi bi-list-ul me-2" style={{ color: 'var(--accent)' }}></i>
                    Ventas del Dia
                  </h6>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {report.sales?.length || 0} ventas
                  </span>
                </div>
                <div className="table-responsive">
                  <table className="table mb-0" style={{ color: 'var(--text-primary)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
                        <th style={{ color: 'var(--text-secondary)', fontWeight: 600, border: 'none' }}>#</th>
                        <th style={{ color: 'var(--text-secondary)', fontWeight: 600, border: 'none' }}>Tipo</th>
                        <th style={{ color: 'var(--text-secondary)', fontWeight: 600, border: 'none' }}>Pago</th>
                        <th style={{ color: 'var(--text-secondary)', fontWeight: 600, border: 'none' }}>Total</th>
                        <th style={{ color: 'var(--text-secondary)', fontWeight: 600, border: 'none' }}>Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!report.sales || report.sales.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                            Sin ventas para esta fecha
                          </td>
                        </tr>
                      ) : (
                        report.sales.map((sale) => (
                          <tr key={sale.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ fontWeight: 600, border: 'none' }}>{sale.id}</td>
                            <td style={{ border: 'none' }}>
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: sale.sale_type === 'llevar' ? 'rgba(233, 69, 96, 0.15)' : 'rgba(52, 152, 219, 0.15)',
                                  color: sale.sale_type === 'llevar' ? 'var(--accent)' : '#3498db',
                                  borderRadius: '8px'
                                }}
                              >
                                {sale.sale_type === 'llevar' ? 'Para Llevar' : `Mesa ${sale.mesa_number || ''}`}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', border: 'none' }}>{sale.payment_method_name}</td>
                            <td style={{ fontWeight: 700, border: 'none' }}>{formatCurrency(sale.total)}</td>
                            <td style={{ color: 'var(--text-muted)', border: 'none' }}>
                              {new Date(sale.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reporte por periodo */}
      <div className="mt-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div className="p-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <h6 style={{ fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            <i className="bi bi-calendar-range me-2" style={{ color: 'var(--accent)' }}></i>
            Reporte Semanal y Mensual
          </h6>
        </div>
        <div className="p-3">
          <div className="d-flex flex-wrap gap-2 mb-3">
            {[
              { key: 'this_week', label: 'Esta Semana', icon: 'bi-calendar-week' },
              { key: 'last_week', label: 'Semana Pasada', icon: 'bi-arrow-left-circle' },
              { key: 'this_month', label: 'Este Mes', icon: 'bi-calendar-month' },
              { key: 'last_month', label: 'Mes Pasado', icon: 'bi-calendar2-minus' }
            ].map(p => (
              <button
                key={p.key}
                className="btn"
                onClick={() => applyPreset(p.key)}
                disabled={loadingPeriod}
                style={{
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  ...(activePreset === p.key
                    ? { backgroundColor: 'var(--accent)', color: 'white', border: '1px solid var(--accent)' }
                    : { backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' })
                }}
              >
                <i className={`bi ${p.icon}`}></i>
                {p.label}
              </button>
            ))}
          </div>

          <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Desde</label>
              <input
                type="date"
                className="form-control"
                value={periodStart}
                onChange={(e) => { setPeriodStart(e.target.value); setActivePreset(null); setPeriodLabel(''); }}
                style={{ fontSize: '0.9rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hasta</label>
              <input
                type="date"
                className="form-control"
                value={periodEnd}
                onChange={(e) => { setPeriodEnd(e.target.value); setActivePreset(null); setPeriodLabel(''); }}
                style={{ fontSize: '0.9rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
              />
            </div>
            <button
              className="btn btn-accent px-4"
              style={{ borderRadius: 'var(--radius-md)', fontWeight: 600 }}
              onClick={() => loadPeriodReport()}
              disabled={loadingPeriod}
            >
              {loadingPeriod ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-search me-2"></i>}
              Buscar
            </button>
          </div>

          {periodSummary && (
            <>
              {periodLabel && (
                <div className="mb-3" style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700 }}>
                  <i className="bi bi-calendar3 me-1"></i>
                  {periodLabel}
                </div>
              )}

              {periodSummary.summary.length > 0 && (
                <div className="row g-3 mb-3">
                  <div className="col-6 col-lg-3">
                    <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-input)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ventas</div>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--accent)' }}>
                        {periodSummary.summary.reduce((s, d) => s + d.total_sales, 0)}
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-lg-3">
                    <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-input)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ingresos</div>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--success)' }}>
                        {formatCurrency(periodSummary.summary.reduce((s, d) => s + Number(d.total_revenue), 0))}
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-lg-3">
                    <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-input)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Efectivo</div>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                        {formatCurrency(periodSummary.summary.reduce((s, d) => s + Number(d.cash_total), 0))}
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-lg-3">
                    <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-input)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>QR</div>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#3498db' }}>
                        {formatCurrency(periodSummary.summary.reduce((s, d) => s + Number(d.qr_total), 0))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="table-responsive">
                <table className="table mb-0" style={{ color: 'var(--text-primary)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
                      <th style={{ color: 'var(--text-secondary)', fontWeight: 600, border: 'none' }}>Fecha</th>
                      <th style={{ color: 'var(--text-secondary)', fontWeight: 600, border: 'none' }}>Ventas</th>
                      <th style={{ color: 'var(--text-secondary)', fontWeight: 600, border: 'none' }}>Ingresos</th>
                      <th style={{ color: 'var(--text-secondary)', fontWeight: 600, border: 'none' }}>Efectivo</th>
                      <th style={{ color: 'var(--text-secondary)', fontWeight: 600, border: 'none' }}>QR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodSummary.summary.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-3" style={{ color: 'var(--text-muted)' }}>
                          Sin datos para este periodo
                        </td>
                      </tr>
                    ) : (
                      <>
                        {periodSummary.summary.map((day, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ fontWeight: 600, border: 'none' }}>{fmtLabel(day.date)}</td>
                            <td style={{ border: 'none' }}>{day.total_sales}</td>
                            <td style={{ fontWeight: 700, border: 'none' }}>{formatCurrency(day.total_revenue)}</td>
                            <td style={{ border: 'none' }}>{formatCurrency(day.cash_total)}</td>
                            <td style={{ border: 'none' }}>{formatCurrency(day.qr_total)}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid var(--accent)' }}>
                          <td style={{ fontWeight: 800, border: 'none' }}>TOTAL</td>
                          <td style={{ fontWeight: 800, border: 'none' }}>{periodSummary.summary.reduce((s, d) => s + d.total_sales, 0)}</td>
                          <td style={{ fontWeight: 800, color: 'var(--accent)', border: 'none' }}>
                            {formatCurrency(periodSummary.summary.reduce((s, d) => s + Number(d.total_revenue), 0))}
                          </td>
                          <td style={{ fontWeight: 700, border: 'none' }}>{formatCurrency(periodSummary.summary.reduce((s, d) => s + Number(d.cash_total), 0))}</td>
                          <td style={{ fontWeight: 700, border: 'none' }}>{formatCurrency(periodSummary.summary.reduce((s, d) => s + Number(d.qr_total), 0))}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

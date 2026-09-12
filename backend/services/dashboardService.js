const saleRepository = require('../repositories/saleRepository');
const cashRegisterRepository = require('../repositories/cashRegisterRepository');
const tableRepository = require('../repositories/tableRepository');
const productRepository = require('../repositories/productRepository');

class DashboardService {
  async getSummary() {
    let salesStats = { total_sales: 0, total_revenue: 0, cash_total: 0, qr_total: 0, takeaway_count: 0, mesa_count: 0 };
    let cashSummary = { total_registers: 0, open_registers: 0, total_revenue: 0, total_cash: 0, total_qr: 0, total_orders: 0 };
    let tableCounts = { total: 0, libre: 0, ocupada: 0, pendiente: 0 };
    let topProducts = [];
    let openRegister = null;

    try { salesStats = await saleRepository.getTodayStats() || salesStats; } catch (e) { console.error('Dashboard salesStats error:', e.message); }
    try { cashSummary = await cashRegisterRepository.getTodaySummary() || cashSummary; } catch (e) { console.error('Dashboard cashSummary error:', e.message); }
    try { tableCounts = await tableRepository.getStatusCounts() || tableCounts; } catch (e) { console.error('Dashboard tableCounts error:', e.message); }
    try { topProducts = await productRepository.topSelling(5) || []; } catch (e) { console.error('Dashboard topProducts error:', e.message); }
    try { openRegister = await cashRegisterRepository.findAnyOpen(); } catch (e) { console.error('Dashboard openRegister error:', e.message); }

    return {
      caja_abierta: !!openRegister,
      caja_info: openRegister ? {
        id: openRegister.id,
        monto_inicial: openRegister.opening_amount,
        abierto_por: openRegister.full_name,
        abierto_en: openRegister.opened_at
      } : null,
      ventas_hoy: {
        total_ventas: salesStats.total_sales,
        total_ingresos: salesStats.total_revenue,
        efectivo: salesStats.cash_total,
        qr: salesStats.qr_total,
        para_llevar: salesStats.takeaway_count,
        en_mesa: salesStats.mesa_count
      },
      mesas: {
        total: tableCounts.total,
        libres: tableCounts.libre,
        ocupadas: tableCounts.ocupada,
        pendientes_pago: tableCounts.pendiente
      },
      productos_mas_vendidos: topProducts
    };
  }
}

module.exports = new DashboardService();

const reportRepository = require('../repositories/reportRepository');

class ReportService {
  async getDailyReport(date) {
    const stats = await reportRepository.getDailyStats(date);
    const sales = await reportRepository.getSalesByDate(date);
    const topProducts = await reportRepository.getTopProducts(date, 10);
    return { date, stats, sales, top_products: topProducts };
  }

  async getTopProducts(date, limit) {
    return reportRepository.getTopProducts(date, limit);
  }

  async getPeriodReport(startDate, endDate) {
    const summary = await reportRepository.getSalesSummaryByPeriod(startDate, endDate);
    return { start_date: startDate, end_date: endDate, summary };
  }
}

module.exports = new ReportService();

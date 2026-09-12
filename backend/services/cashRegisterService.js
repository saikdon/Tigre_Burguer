const cashRegisterRepository = require('../repositories/cashRegisterRepository');
const saleRepository = require('../repositories/saleRepository');

class CashRegisterService {
  async open(userId, openingAmount) {
    const openRegister = await cashRegisterRepository.findOpenByUser(userId);
    if (openRegister) {
      throw Object.assign(new Error('Ya tiene una caja abierta. Cierre la caja actual antes de abrir una nueva.'), { status: 400 });
    }

    const anyOpen = await cashRegisterRepository.findAnyOpen();
    if (anyOpen) {
      throw Object.assign(new Error(`Ya existe una caja abierta por ${anyOpen.full_name}. Solo puede haber una caja abierta a la vez.`), { status: 400 });
    }

    const id = await cashRegisterRepository.create({ user_id: userId, opening_amount: openingAmount });
    return cashRegisterRepository.findById(id);
  }

  async getOpenRegister() {
    return cashRegisterRepository.findAnyOpen();
  }

  async getById(id) {
    const register = await cashRegisterRepository.findById(id);
    if (!register) {
      throw Object.assign(new Error('Caja no encontrada'), { status: 404 });
    }
    return register;
  }

  async close(registerId, userId, closingAmount) {
    const register = await cashRegisterRepository.findById(registerId);
    if (!register) {
      throw Object.assign(new Error('Caja no encontrada'), { status: 404 });
    }

    if (register.status === 'cerrada') {
      throw Object.assign(new Error('Esta caja ya está cerrada'), { status: 400 });
    }

    if (register.user_id !== userId) {
      throw Object.assign(new Error('Solo el usuario que abrió la caja puede cerrarla'), { status: 403 });
    }

    await cashRegisterRepository.updateSales(registerId);
    const updatedRegister = await cashRegisterRepository.findById(registerId);

    const closingData = {
      closing_amount: closingAmount,
      cash_sales: updatedRegister.cash_sales || 0,
      qr_sales: updatedRegister.qr_sales || 0,
      total_sales: updatedRegister.total_sales || 0,
      order_count: updatedRegister.order_count || 0
    };

    await cashRegisterRepository.close(registerId, closingData);
    return cashRegisterRepository.findById(registerId);
  }

  async getSales(registerId) {
    return saleRepository.findByCajaId(registerId);
  }

  async getSalesDetails(registerId) {
    const register = await cashRegisterRepository.findById(registerId);
    if (!register) {
      throw Object.assign(new Error('Caja no encontrada'), { status: 404 });
    }
    return cashRegisterRepository.getSalesWithDetails(registerId);
  }

  async getClosingSummary(registerId) {
    const register = await cashRegisterRepository.findById(registerId);
    if (!register) {
      throw Object.assign(new Error('Caja no encontrada'), { status: 404 });
    }
    await cashRegisterRepository.updateSales(registerId);
    const updatedRegister = await cashRegisterRepository.findById(registerId);
    const productSummary = await cashRegisterRepository.getProductSummary(registerId);
    const sales = await cashRegisterRepository.getSalesWithDetails(registerId);
    return {
      register: updatedRegister,
      sales,
      product_summary: productSummary
    };
  }

  async getSummary(registerId) {
    const register = await cashRegisterRepository.findById(registerId);
    if (!register) {
      throw Object.assign(new Error('Caja no encontrada'), { status: 404 });
    }

    await cashRegisterRepository.updateSales(registerId);
    return cashRegisterRepository.findById(registerId);
  }

  async getTodaySummary() {
    return cashRegisterRepository.getTodaySummary();
  }
}

module.exports = new CashRegisterService();

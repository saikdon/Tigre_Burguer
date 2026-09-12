const tableRepository = require('../repositories/tableRepository');

class TableService {
  async getAll() {
    return tableRepository.findAll();
  }

  async getById(id) {
    const table = await tableRepository.findById(id);
    if (!table) {
      throw Object.assign(new Error('Mesa no encontrada'), { status: 404 });
    }
    return table;
  }

  async updateStatus(id, status) {
    const table = await tableRepository.findById(id);
    if (!table) {
      throw Object.assign(new Error('Mesa no encontrada'), { status: 404 });
    }

    const validStatuses = ['libre', 'ocupada', 'pendiente_pago'];
    if (!validStatuses.includes(status)) {
      throw Object.assign(new Error('Estado de mesa inválido'), { status: 400 });
    }

    return tableRepository.updateStatus(id, status);
  }

  async getStatusCounts() {
    const libre = await tableRepository.countByStatus('libre');
    const ocupada = await tableRepository.countByStatus('ocupada');
    const pendiente = await tableRepository.countByStatus('pendiente_pago');
    return { libre, ocupada, pendiente, total: libre + ocupada + pendiente };
  }
}

module.exports = new TableService();

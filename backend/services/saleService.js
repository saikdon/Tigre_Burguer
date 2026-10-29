const saleRepository = require('../repositories/saleRepository');
const cashRegisterRepository = require('../repositories/cashRegisterRepository');
const tableRepository = require('../repositories/tableRepository');
const paymentRepository = require('../repositories/paymentRepository');
const productRepository = require('../repositories/productRepository');
const { pool } = require('../config/database');

class SaleService {
  async createTakeawaySale(userId, paymentMethodName, items, payments) {
    const register = await cashRegisterRepository.findAnyOpen();
    if (!register) {
      throw Object.assign(new Error('No hay una caja abierta. Abra una caja primero.'), { status: 400 });
    }

    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    let salePayments = [];
    let primaryPaymentId = null;

    if (payments && payments.length > 0) {
      for (const p of payments) {
        const pm = await this._getPaymentMethod(p.payment_method);
        salePayments.push({ payment_method_id: pm.id, amount: p.amount });
      }
      primaryPaymentId = salePayments[0].payment_method_id;
    } else {
      const paymentMethod = await this._getPaymentMethod(paymentMethodName);
      primaryPaymentId = paymentMethod.id;
      salePayments = [{ payment_method_id: paymentMethod.id, amount: subtotal }];
    }

    const saleId = await saleRepository.create({
      caja_id: register.id,
      mesa_id: null,
      user_id: userId,
      payment_method_id: primaryPaymentId,
      sale_type: 'llevar',
      subtotal,
      total: subtotal,
      status: 'cerrada',
      payments: salePayments,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity,
        notes: item.notes || null
      }))
    });

    await cashRegisterRepository.updateSales(register.id);
    return saleRepository.findById(saleId);
  }

  async openMesaSale(userId, mesaId, items) {
    const register = await cashRegisterRepository.findAnyOpen();
    if (!register) {
      throw Object.assign(new Error('No hay una caja abierta. Abra una caja primero.'), { status: 400 });
    }

    const table = await tableRepository.findById(mesaId);
    if (!table) {
      throw Object.assign(new Error('Mesa no encontrada'), { status: 404 });
    }

    const existingSale = await saleRepository.findActiveByMesa(mesaId);
    if (existingSale) {
      throw Object.assign(new Error('La mesa ya tiene una orden activa'), { status: 400 });
    }

    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const saleId = await saleRepository.create({
      caja_id: register.id,
      mesa_id: mesaId,
      user_id: userId,
      payment_method_id: 1,
      sale_type: 'mesa',
      subtotal,
      total: subtotal,
      status: 'activa',
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity,
        notes: item.notes || null
      }))
    });

    await tableRepository.updateStatus(mesaId, 'ocupada');
    return saleRepository.findById(saleId);
  }

  async addItemsToMesaSale(saleId, items) {
    const sale = await saleRepository.findById(saleId);
    if (!sale) {
      throw Object.assign(new Error('Orden no encontrada'), { status: 404 });
    }

    if (sale.status !== 'activa') {
      throw Object.assign(new Error('Esta orden ya está cerrada'), { status: 400 });
    }

    for (const item of items) {
      await saleRepository.addItem(saleId, {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity,
        notes: item.notes || null
      });
    }

    return saleRepository.findById(saleId);
  }

  async updateItemQuantity(itemId, quantity) {
    await saleRepository.updateItemQuantity(itemId, quantity);
  }

  async removeItem(itemId) {
    await saleRepository.removeItem(itemId);
  }

  async closeMesaSale(saleId, paymentMethodName, payments) {
    const sale = await saleRepository.findById(saleId);
    if (!sale) {
      throw Object.assign(new Error('Orden no encontrada'), { status: 404 });
    }

    if (sale.status !== 'activa') {
      throw Object.assign(new Error('Esta orden ya está cerrada'), { status: 400 });
    }

    let primaryPaymentId = null;

    if (payments && payments.length > 0) {
      for (const p of payments) {
        const pm = await this._getPaymentMethod(p.payment_method);
        await paymentRepository.createBulk(saleId, [{ payment_method_id: pm.id, amount: p.amount }]);
      }
      const firstPm = await this._getPaymentMethod(payments[0].payment_method);
      primaryPaymentId = firstPm.id;
    } else {
      const paymentMethod = await this._getPaymentMethod(paymentMethodName);
      primaryPaymentId = paymentMethod.id;
      await paymentRepository.createBulk(saleId, [{ payment_method_id: paymentMethod.id, amount: sale.total }]);
    }

    await saleRepository.updatePaymentMethod(saleId, primaryPaymentId);
    await saleRepository.updateStatus(saleId, 'cerrada');

    if (sale.mesa_id) {
      await tableRepository.updateStatus(sale.mesa_id, 'libre');
    }

    await cashRegisterRepository.updateSales(sale.caja_id);

    return saleRepository.findById(saleId);
  }

  async getActiveSaleByMesa(mesaId) {
    return saleRepository.findActiveByMesa(mesaId);
  }

  async getSaleById(id) {
    const sale = await saleRepository.findById(id);
    if (!sale) {
      throw Object.assign(new Error('Orden no encontrada'), { status: 404 });
    }
    return sale;
  }

  async getTodayStats() {
    return saleRepository.getTodayStats();
  }

  async createReservation(userId, items, notes) {
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const saleId = await saleRepository.create({
      caja_id: null,
      mesa_id: null,
      user_id: userId,
      payment_method_id: 1,
      sale_type: 'llevar',
      subtotal,
      total: subtotal,
      status: 'reservada',
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity,
        notes: item.notes || null
      }))
    });

    return saleRepository.findById(saleId);
  }

  async createPublicReservation({ customer_name, customer_phone, payment_preference, notes, items }) {
    const productIds = [...new Set(items.map((item) => Number(item.product_id)))];
    const products = await productRepository.findActiveByIds(productIds);
    if (products.length !== productIds.length) {
      throw Object.assign(new Error('Uno o más productos ya no están disponibles'), { status: 400 });
    }

    const byId = new Map(products.map((product) => [Number(product.id), product]));
    const normalizedLines = new Map();
    for (const item of items) {
      const productId = Number(item.product_id);
      const product = byId.get(productId);
      const customization = normalizeCustomization(item.customizations, product);
      const key = `${productId}|${customization.notes || ''}`;
      const current = normalizedLines.get(key) || { product, quantity: 0, notes: customization.notes };
      current.quantity += Number(item.quantity);
      normalizedLines.set(key, current);
    }

    const lineItems = [...normalizedLines.values()].map(({ product, quantity, notes: itemNotes }) => {
      const unitPrice = Number(product.price);
      return { product_id: product.id, quantity, unit_price: unitPrice, subtotal: unitPrice * quantity, notes: itemNotes };
    });
    const total = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
    const userId = await this._getPublicReservationUserId();
    const paymentMethod = await this._getPaymentMethod(payment_preference);

    const saleId = await saleRepository.create({
      caja_id: null,
      mesa_id: null,
      user_id: userId,
      payment_method_id: paymentMethod.id,
      sale_type: 'llevar',
      subtotal: total,
      total,
      status: 'reservada',
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.replace(/[\s-]/g, ''),
      payment_preference,
      reservation_notes: notes?.trim() || null,
      items: lineItems
    });

    return saleRepository.findById(saleId);
  }

  async fulfillReservation(saleId, paymentMethodName, payments) {
    const sale = await saleRepository.findById(saleId);
    if (!sale) {
      throw Object.assign(new Error('Reserva no encontrada'), { status: 404 });
    }

    if (sale.status !== 'reservada') {
      throw Object.assign(new Error('Esta reserva ya fue procesada'), { status: 400 });
    }

    const register = await cashRegisterRepository.findAnyOpen();
    if (!register) {
      throw Object.assign(new Error('No hay una caja abierta. Abra una caja primero.'), { status: 400 });
    }

    let primaryPaymentId = null;

    if (payments && payments.length > 0) {
      const paymentEntries = [];
      for (const p of payments) {
        const pm = await this._getPaymentMethod(p.payment_method);
        paymentEntries.push({ payment_method_id: pm.id, amount: p.amount });
      }
      await paymentRepository.createBulk(saleId, paymentEntries);
      const firstPm = await this._getPaymentMethod(payments[0].payment_method);
      primaryPaymentId = firstPm.id;
    } else {
      const paymentMethod = await this._getPaymentMethod(paymentMethodName);
      primaryPaymentId = paymentMethod.id;
      await paymentRepository.createBulk(saleId, [{ payment_method_id: paymentMethod.id, amount: sale.total }]);
    }

    await saleRepository.updatePaymentMethod(saleId, primaryPaymentId);
    await pool.query('UPDATE ventas SET caja_id = ?, status = "cerrada" WHERE id = ?', [register.id, saleId]);

    await cashRegisterRepository.updateSales(register.id);

    return saleRepository.findById(saleId);
  }

  async cancelReservation(saleId) {
    const sale = await saleRepository.findById(saleId);
    if (!sale) {
      throw Object.assign(new Error('Reserva no encontrada'), { status: 404 });
    }

    if (sale.status !== 'reservada') {
      throw Object.assign(new Error('Solo se pueden cancelar reservas'), { status: 400 });
    }

    await saleRepository.cancelReservation(saleId);
    return { message: 'Reserva cancelada' };
  }

  async getReservations() {
    return saleRepository.findReservations();
  }

  async _getPaymentMethod(name) {
    const { pool } = require('../config/database');
    const [rows] = await pool.query('SELECT * FROM metodos_pago WHERE name = ?', [name]);
    if (rows.length === 0) {
      throw Object.assign(new Error('Método de pago no válido'), { status: 400 });
    }
    return rows[0];
  }

  async _getPublicReservationUserId() {
    const configuredId = Number(process.env.PUBLIC_RESERVATION_USER_ID);
    if (configuredId) {
      const [users] = await pool.query('SELECT id FROM usuarios WHERE id = ? AND status = "activo"', [configuredId]);
      if (!users.length) throw Object.assign(new Error('El usuario público de reservas no está disponible'), { status: 500 });
      return users[0].id;
    }

    const username = process.env.PUBLIC_RESERVATION_USERNAME || 'reservas_publicas';
    const [existing] = await pool.query('SELECT id FROM usuarios WHERE username = ?', [username]);
    if (existing.length) return existing[0].id;

    const bcrypt = require('bcryptjs');
    const [roles] = await pool.query("SELECT id FROM roles WHERE name = 'cajero' LIMIT 1");
    if (!roles.length) throw Object.assign(new Error('No existe un rol para las reservas públicas'), { status: 500 });
    const password = await bcrypt.hash(require('crypto').randomBytes(32).toString('hex'), 10);
    const [created] = await pool.query(
      'INSERT INTO usuarios (username, password, full_name, role_id, status) VALUES (?, ?, ?, ?, "activo")',
      [username, password, 'Reservas públicas', roles[0].id]
    );
    return created.insertId;
  }
}

const ALLOWED_SAUCES = ['Ketchup', 'Mayonesa', 'Mostaza', 'Llajua'];
const ALLOWED_SALAD = ['Cebolla', 'Tomate'];

function normalizeCustomization(customizations = {}, product) {
  const sauces = uniqueAllowed(customizations?.sauces, ALLOWED_SAUCES, 'Aderezo inválido');
  const salad = uniqueAllowed(customizations?.salad, ALLOWED_SALAD, 'Ingrediente de ensalada inválido');

  if (sauces.length && !Number(product.allows_sauces)) {
    throw Object.assign(new Error(`${product.name} no admite aderezos`), { status: 400 });
  }
  if (salad.length && !Number(product.allows_salad)) {
    throw Object.assign(new Error(`${product.name} no admite ensalada`), { status: 400 });
  }

  const parts = [];
  if (Number(product.allows_sauces)) {
    parts.push(`Aderezos: ${sauces.length ? sauces.join(', ') : 'Sin seleccionar'}`);
  }
  if (Number(product.allows_salad)) {
    parts.push(`Ensalada: ${salad.length ? salad.join(', ') : 'Sin seleccionar'}`);
  }
  return { sauces, salad, notes: parts.join(' · ') || null };
}

function uniqueAllowed(values, allowed, message) {
  if (values === undefined || values === null) return [];
  if (!Array.isArray(values)) throw Object.assign(new Error(message), { status: 400 });
  const unique = [...new Set(values)];
  if (unique.some((value) => !allowed.includes(value))) throw Object.assign(new Error(message), { status: 400 });
  return unique;
}

module.exports = new SaleService();

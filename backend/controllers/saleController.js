const saleService = require('../services/saleService');

exports.createTakeaway = async (req, res, next) => {
  try {
    const sale = await saleService.createTakeawaySale(
      req.user.id,
      req.body.payment_method,
      req.body.items,
      req.body.payments
    );
    res.status(201).json({ sale, message: 'Venta registrada correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.openMesa = async (req, res, next) => {
  try {
    const sale = await saleService.openMesaSale(
      req.user.id,
      req.body.mesa_id,
      req.body.items
    );
    res.status(201).json({ sale, message: 'Orden de mesa abierta correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.addToMesaSale = async (req, res, next) => {
  try {
    const sale = await saleService.addItemsToMesaSale(
      req.params.id,
      req.body.items
    );
    res.json({ sale, message: 'Productos agregados correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.updateItemQuantity = async (req, res, next) => {
  try {
    await saleService.updateItemQuantity(req.params.itemId, req.body.quantity);
    res.json({ message: 'Cantidad actualizada' });
  } catch (error) {
    next(error);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    await saleService.removeItem(req.params.itemId);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    next(error);
  }
};

exports.closeMesaSale = async (req, res, next) => {
  try {
    const sale = await saleService.closeMesaSale(req.params.id, req.body.payment_method, req.body.payments);
    res.json({ sale, message: 'Mesa cerrada y venta registrada correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.getActiveByMesa = async (req, res, next) => {
  try {
    const sale = await saleService.getActiveSaleByMesa(req.params.mesaId);
    res.json(sale || null);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const sale = await saleService.getSaleById(req.params.id);
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

exports.getTodayStats = async (req, res, next) => {
  try {
    const stats = await saleService.getTodayStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

exports.createReservation = async (req, res, next) => {
  try {
    const sale = await saleService.createReservation(
      req.user.id,
      req.body.items,
      req.body.notes
    );
    res.status(201).json({ sale, message: 'Reserva registrada correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.fulfillReservation = async (req, res, next) => {
  try {
    const sale = await saleService.fulfillReservation(req.params.id, req.body.payment_method, req.body.payments);
    res.json({ sale, message: 'Reserva cobrada correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.cancelReservation = async (req, res, next) => {
  try {
    const result = await saleService.cancelReservation(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getReservations = async (req, res, next) => {
  try {
    const reservations = await saleService.getReservations();
    res.json(reservations);
  } catch (error) {
    next(error);
  }
};

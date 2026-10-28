const saleService = require('../services/saleService');
const productRepository = require('../repositories/productRepository');
const categoryRepository = require('../repositories/categoryRepository');

exports.getCatalog = async (req, res, next) => {
  try {
    const [categories, products] = await Promise.all([
      categoryRepository.findActive(),
      productRepository.findActive()
    ]);
    res.json({ categories, products });
  } catch (error) {
    next(error);
  }
};

exports.createReservation = async (req, res, next) => {
  try {
    const sale = await saleService.createPublicReservation(req.body);
    res.status(201).json({
      reservation: { id: sale.id, total: sale.total, payment_preference: sale.payment_preference },
      message: 'Tu pedido fue reservado. Te esperamos para confirmar el pago al recoger.'
    });
  } catch (error) {
    next(error);
  }
};

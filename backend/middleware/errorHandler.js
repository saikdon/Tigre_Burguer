const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido en el cuerpo de la solicitud.' });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Ya existe un registro con esos datos.' });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ message: 'Referencia a un registro que no existe.' });
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({ message: 'No se puede eliminar: existen registros dependientes.' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor'
  });
};

module.exports = { errorHandler };

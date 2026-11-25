const { createSupplierRegistry } = require("./src/registry");
const { createSupplierService } = require("./src/service");
const { createSupplierRouter } = require("./src/routes");

module.exports = { createSupplierRegistry, createSupplierService, createSupplierRouter };

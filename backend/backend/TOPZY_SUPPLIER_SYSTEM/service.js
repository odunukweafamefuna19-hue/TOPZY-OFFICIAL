const { normalizeProduct } = require("./normalizer");

function createSupplierService(registry) {
  async function getProviderProducts(provider, options) {
    try {
      const result = await provider.getProducts(options || {});
      const rows = Array.isArray(result) ? result : (result && result.products) || [];
      return rows.map(row => normalizeProduct(row, provider.id)).filter(Boolean);
    } catch (error) {
      return { supplierId: provider.id, error: error.message || "Supplier request failed" };
    }
  }

  return {
    listProviders() { return registry.list(); },

    async getCatalog(options = {}) {
      const providers = options.supplierId
        ? [registry.get(options.supplierId)].filter(Boolean)
        : registry.enabled();

      const results = await Promise.all(providers.map(p => getProviderProducts(p, options)));
      const products = [];
      const errors = [];

      for (const result of results) {
        if (Array.isArray(result)) products.push(...result);
        else errors.push(result);
      }

      return { products, errors };
    },

    async getProduct(supplierId, productId) {
      const provider = registry.get(supplierId);
      if (!provider) throw Object.assign(new Error("Supplier not found"), { status: 404 });
      if (typeof provider.getProduct !== "function") {
        throw Object.assign(new Error("This supplier does not support product lookup"), { status: 501 });
      }
      const raw = await provider.getProduct(productId);
      const product = normalizeProduct(raw, supplierId);
      if (!product) throw Object.assign(new Error("Product not found or invalid"), { status: 404 });
      return product;
    },

    async createOrder(supplierId, order) {
      const provider = registry.get(supplierId);
      if (!provider) throw Object.assign(new Error("Supplier not found"), { status: 404 });
      if (provider.enabled === false) throw Object.assign(new Error("Supplier is disabled"), { status: 409 });
      if (typeof provider.createOrder !== "function") {
        throw Object.assign(new Error("Ordering is not configured for this supplier"), { status: 501 });
      }
      return provider.createOrder(order);
    }
  };
}

module.exports = { createSupplierService };

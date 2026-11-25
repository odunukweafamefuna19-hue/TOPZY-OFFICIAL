function createSupplierRegistry(adapters = []) {
  const providers = new Map();

  for (const adapter of adapters) {
    if (!adapter || !adapter.id || typeof adapter.getProducts !== "function") {
      throw new Error("Each supplier adapter needs an id and getProducts() method");
    }
    if (providers.has(adapter.id)) throw new Error(`Duplicate supplier id: ${adapter.id}`);
    providers.set(adapter.id, adapter);
  }

  return {
    list() {
      return [...providers.values()].map(({ id, name, enabled = true }) => ({
        id, name: name || id, enabled: Boolean(enabled)
      }));
    },
    get(id) { return providers.get(id); },
    enabled() { return [...providers.values()].filter(p => p.enabled !== false); }
  };
}

module.exports = { createSupplierRegistry };

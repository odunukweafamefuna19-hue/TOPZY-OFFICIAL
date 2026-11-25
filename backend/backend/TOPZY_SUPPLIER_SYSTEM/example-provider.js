// Replace these methods with the supplier's real API calls and credentials.
// Never put private API keys in frontend code.
function createExampleProvider({ apiKey, baseUrl }) {
  return {
    id: "example-provider",
    name: "Example Provider",
    enabled: Boolean(apiKey && baseUrl),

    async getProducts() {
      if (!this.enabled) return [];
      // TODO: Call the provider catalog endpoint using apiKey.
      // Return raw products with: id, name, price, currency, inStock.
      return [];
    },

    async getProduct(productId) {
      if (!this.enabled) throw new Error("Provider credentials are missing");
      // TODO: Fetch one product by productId.
      return null;
    },

    async createOrder(order) {
      if (!this.enabled) throw new Error("Provider credentials are missing");
      // TODO: Submit the order to the supplier and return its reference/status.
      throw new Error("Order endpoint is not configured");
    }
  };
}

module.exports = { createExampleProvider };

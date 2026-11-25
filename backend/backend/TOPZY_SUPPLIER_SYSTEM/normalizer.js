function normalizeProduct(raw, supplierId) {
  if (!raw || !raw.id || !raw.name) return null;

  const price = Number(raw.price);
  if (!Number.isFinite(price) || price < 0) return null;

  return {
    supplierId,
    supplierProductId: String(raw.id),
    name: String(raw.name).trim(),
    description: raw.description ? String(raw.description) : "",
    price,
    currency: raw.currency || "NGN",
    inStock: raw.inStock !== false,
    imageUrl: raw.imageUrl || null,
    category: raw.category || "Other",
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {}
  };
}

module.exports = { normalizeProduct };

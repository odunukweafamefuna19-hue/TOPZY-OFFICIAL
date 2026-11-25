const crypto = require("node:crypto");

const ALLOWED_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};

function createOrderEngine({ supabase, getUser, now = () => new Date() }) {
  if (!supabase) throw new Error("A Supabase client is required.");
  if (typeof getUser !== "function") throw new Error("getUser(req) is required.");

  async function createOrder(req, payload) {
    const user = await getUser(req);
    if (!user?.id) {
      const error = new Error("Authentication required.");
      error.status = 401;
      throw error;
    }

    const items = Array.isArray(payload?.items) ? payload.items : [];
    if (!items.length) {
      const error = new Error("Add at least one item.");
      error.status = 400;
      throw error;
    }

    const normalized = items.map((item) => ({
      product_id: String(item.product_id || ""),
      quantity: Number(item.quantity)
    }));

    if (normalized.some((item) => !item.product_id || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      const error = new Error("Each item needs a product_id and a positive whole-number quantity.");
      error.status = 400;
      throw error;
    }

    const productIds = [...new Set(normalized.map((item) => item.product_id))];
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id,name,price,stock,is_active")
      .in("id", productIds);

    if (productError) throw productError;
    if (!products || products.length !== productIds.length) {
      const error = new Error("One or more products could not be found.");
      error.status = 400;
      throw error;
    }

    const productMap = new Map(products.map((product) => [String(product.id), product]));
    const orderItems = [];
    let total = 0;

    for (const item of normalized) {
      const product = productMap.get(item.product_id);
      const price = Number(product.price);
      if (product.is_active === false || !Number.isFinite(price) || price < 0) {
        const error = new Error(`Product ${item.product_id} is unavailable.`);
        error.status = 400;
        throw error;
      }
      if (Number.isFinite(Number(product.stock)) && Number(product.stock) < item.quantity) {
        const error = new Error(`Insufficient stock for ${product.name || item.product_id}.`);
        error.status = 409;
        throw error;
      }
      const lineTotal = price * item.quantity;
      total += lineTotal;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: price,
        line_total: lineTotal
      });
    }

    const reference = `TPZ-${now().getTime()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        reference,
        status: "pending",
        total_amount: total,
        currency: "NGN",
        customer_note: typeof payload.customer_note === "string" ? payload.customer_note.slice(0, 1000) : null
      })
      .select("*")
      .single();

    if (orderError) throw orderError;

    const rows = orderItems.map((item) => ({ ...item, order_id: order.id }));
    const { error: itemsError } = await supabase.from("order_items").insert(rows);

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      throw itemsError;
    }

    return { ...order, items: orderItems };
  }

  async function listMyOrders(req) {
    const user = await getUser(req);
    if (!user?.id) {
      const error = new Error("Authentication required.");
      error.status = 401;
      throw error;
    }
    const { data, error } = await supabase
      .from("orders")
      .select("*,order_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function getMyOrder(req, orderId) {
    const user = await getUser(req);
    if (!user?.id) {
      const error = new Error("Authentication required.");
      error.status = 401;
      throw error;
    }
    const { data, error } = await supabase
      .from("orders")
      .select("*,order_items(*)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      const notFound = new Error("Order not found.");
      notFound.status = 404;
      throw notFound;
    }
    return data;
  }

  async function updateOrderStatus(orderId, nextStatus, actor = "admin") {
    const { data: current, error: readError } = await supabase
      .from("orders")
      .select("id,status")
      .eq("id", orderId)
      .maybeSingle();
    if (readError) throw readError;
    if (!current) {
      const notFound = new Error("Order not found.");
      notFound.status = 404;
      throw notFound;
    }
    if (!Object.prototype.hasOwnProperty.call(ALLOWED_TRANSITIONS, current.status) ||
        !ALLOWED_TRANSITIONS[current.status].includes(nextStatus)) {
      const invalid = new Error(`Status cannot move from ${current.status} to ${nextStatus}.`);
      invalid.status = 409;
      throw invalid;
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status: nextStatus, updated_at: now().toISOString(), status_updated_by: actor })
      .eq("id", orderId)
      .eq("status", current.status)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  return { createOrder, listMyOrders, getMyOrder, updateOrderStatus };
}

module.exports = { createOrderEngine, ALLOWED_TRANSITIONS };
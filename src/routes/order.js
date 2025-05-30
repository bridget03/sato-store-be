import express from "express";
import Order from "../models/Order.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware xác thực token
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  console.log("Auth middleware: token:", token);
  if (!token) {
    console.error("Auth middleware: No token provided");
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Auth middleware: Decoded token:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth middleware: Invalid token:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Get all orders for the authenticated user with pagination
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      console.error("Invalid pagination parameters:", { page, limit });
      return res.status(400).json({ message: "Invalid pagination parameters" });
    }

    console.log("Fetching orders for userId:", req.user.id);
    const query = { userId: req.user.id };

    const [orders, totalOrders] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalOrders / limitNum);

    console.log("Orders found:", orders.length, "Total orders:", totalOrders);

    res.status(200).json({
      success: true,
      orders,
      totalOrders,
      totalPages,
      currentPage: pageNum,
    });
  } catch (error) {
    console.error("Error fetching orders:", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Failed to fetch orders", error: error.message });
  }
});

// Create a new order
router.post("/", async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    console.log("Order created:", newOrder._id);
    res
      .status(201)
      .json({ message: "Order created successfully", order: newOrder });
  } catch (error) {
    console.error("Error creating order:", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Failed to create order", error: error.message });
  }
});

// Get order by ID
router.get("/:orderId", auth, async (req, res) => {
  try {
    console.log("Fetching order for orderId:", req.params.orderId);
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      console.error(
        "Order not found in collection 'orders':",
        req.params.orderId
      );
      return res.status(404).json({ message: "Order not found" });
    }
    console.log("Order found:", order);
    return res.status(200).json({ order });
  } catch (error) {
    console.error("Error fetching order:", error.message, error.stack);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE order by ID
router.delete("/:orderId", auth, async (req, res) => {
  const { orderId } = req.params;

  try {
    console.log("Deleting order:", orderId);
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      console.error("Order not found for deletion:", orderId);
      return res.status(404).json({ message: "Order not found" });
    }

    console.log("Order deleted:", orderId);
    res
      .status(200)
      .json({ message: "Order deleted successfully", order: deletedOrder });
  } catch (error) {
    console.error("Error deleting order:", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Failed to delete order", error: error.message });
  }
});

// DELETE all orders
router.delete("/", auth, async (req, res) => {
  try {
    console.log("Deleting all orders");
    const result = await Order.deleteMany({});
    console.log("Deleted orders count:", result.deletedCount);
    res.status(200).json({
      message: "All orders deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all orders:", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Failed to delete orders", error: error.message });
  }
});

export default router;

import express from "express";
import Order from "../models/order.js";

const router = express.Router();

// Create a new order
router.post("/", async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
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

export default router;

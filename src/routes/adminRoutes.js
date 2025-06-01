import express from "express";
import Product from "../models/productModel.js";
import authAdmin from "../middleware/authAdmin.js";
import Order from "../models/Order.js";
import auth from "../middleware/auth.js";
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - description
 *         - type
 *         - material
 *         - size
 *         - images
 *       properties:
 *         name:
 *           type: string
 *           description: Tên sản phẩm
 *         price:
 *           type: number
 *           description: Giá sản phẩm
 *         description:
 *           type: string
 *           description: Mô tả sản phẩm
 *         type:
 *           type: string
 *           description: Loại sản phẩm
 *         material:
 *           type: string
 *           description: Chất liệu sản phẩm
 *         size:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 enum: [S, M, L, XL, XXL]
 *               amount:
 *                 type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian xóa mềm
 */

/**
 * @swagger
 * /api/admin/product/new:
 *   post:
 *     summary: Tạo sản phẩm mới
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Sản phẩm đã được tạo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 */
router.post("/product/new", authAdmin, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: Lấy danh sách tất cả sản phẩm (bao gồm đã xóa)
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get("/products", authAdmin, async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/products/active:
 *   get:
 *     summary: Lấy danh sách sản phẩm đang hoạt động
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm đang hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get("/products/active", authAdmin, async (req, res) => {
  try {
    const products = await Product.find({ deletedAt: null });
    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/product/{id}:
 *   get:
 *     summary: Lấy thông tin một sản phẩm
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Thông tin sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *   put:
 *     summary: Cập nhật thông tin sản phẩm
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Sản phẩm đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *   delete:
 *     summary: Xóa mềm sản phẩm
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Sản phẩm đã được xóa mềm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.get("/product/:id", authAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.put("/product/:id", authAdmin, async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete("/product/:id", authAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Soft delete by setting deletedAt
    product.deletedAt = new Date();
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/product/{id}/restore:
 *   post:
 *     summary: Khôi phục sản phẩm đã xóa
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Sản phẩm đã được khôi phục
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 */
router.post("/product/:id/restore", authAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Restore by setting deletedAt to null
    product.deletedAt = null;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product restored successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Order routes - Specific routes first
router.get("/orders/revenue", authAdmin, async (req, res) => {
  try {
    console.log("Starting revenue calculation...");

    const orders = await Order.find()
      .select(
        "totalAmount orderStatus paymentStatus paymentMethod userId createdAt"
      )
      .lean();

    console.log("Found orders:", orders ? orders.length : "null");

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found",
      });
    }

    const revenueByStatus = {};
    let totalRevenue = 0;

    for (const order of orders) {
      try {
        const status = order.orderStatus || "unknown";
        const amount = parseFloat(order.totalAmount || 0);

        if (!revenueByStatus[status]) {
          revenueByStatus[status] = {
            totalAmount: 0,
            count: 0,
          };
        }

        if (!isNaN(amount)) {
          revenueByStatus[status].totalAmount += amount;
          revenueByStatus[status].count += 1;
          totalRevenue += amount;
        }
      } catch (orderError) {
        console.error("Error processing order:", order._id, orderError);
      }
    }

    // Format numbers
    totalRevenue = Number(totalRevenue.toFixed(2));
    Object.keys(revenueByStatus).forEach((status) => {
      revenueByStatus[status].totalAmount = Number(
        revenueByStatus[status].totalAmount.toFixed(2)
      );
    });

    const formattedOrders = orders.map((order) => ({
      id: order._id,
      userId: order.userId,
      totalAmount: order.totalAmount || 0,
      orderStatus: order.orderStatus || "unknown",
      paymentStatus: order.paymentStatus || "unknown",
      paymentMethod: order.paymentMethod || "unknown",
      createdAt: order.createdAt,
    }));

    console.log("Successfully calculated revenue");

    res.status(200).json({
      success: true,
      totalRevenue,
      totalOrders: orders.length,
      revenueByStatus,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Revenue calculation error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    res.status(500).json({
      success: false,
      error: "Error calculating revenue",
      details: error.message,
    });
  }
});

// General orders list route
router.get("/orders", authAdmin, async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

import express from "express";
import { body, param, validationResult } from "express-validator";
import Cart from "../models/Cart.js";
import Product from "../models/productModel.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       required:
 *         - _id
 *         - quantity
 *         - price
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: ID của sản phẩm
 *         quantity:
 *           type: number
 *           minimum: 1
 *           description: Số lượng sản phẩm
 *         price:
 *           type: number
 *           description: Giá sản phẩm
 *         name:
 *           type: string
 *           description: Tên sản phẩm
 *         image:
 *           type: string
 *           description: URL hình ảnh sản phẩm
 *     Cart:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: ID của người dùng sở hữu giỏ hàng
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         totalAmount:
 *           type: number
 *           description: Tổng giá trị giỏ hàng
 */

/**
 * @swagger
 * /api/cart/{userId}:
 *   get:
 *     summary: Lấy thông tin giỏ hàng của người dùng
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: Thông tin giỏ hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       403:
 *         description: Không có quyền truy cập giỏ hàng này
 */
router.get(
  "/cart/:userId",
  [
    param("userId")
      .isMongoId()
      .withMessage("Invalid user ID format")
  ],
  auth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Ensure user can only access their own cart
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ message: "Unauthorized access to cart" });
    }

    try {
      // Find or create cart for the user
      let cart = await Cart.findOne({ userId: req.params.userId });
      
      if (!cart) {
        cart = new Cart({
          userId: req.params.userId,
          items: [],
          totalAmount: 0
        });
        await cart.save();
      }
      
      res.status(200).json(cart);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Error fetching cart" });
    }
  }
);

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _id
 *               - quantity
 *             properties:
 *               _id:
 *                 type: string
 *                 description: ID của sản phẩm
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Số lượng sản phẩm
 *               size:
 *                 type: string
 *                 description: Kích thước sản phẩm
 *     responses:
 *       200:
 *         description: Sản phẩm đã được thêm vào giỏ hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 */
router.post(
  "/cart",
  [
    auth,
    body("_id")
      .isMongoId()
      .withMessage("Invalid product ID format"),
    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    body("size")
      .isString()
      .isIn(['S', 'M', 'L', 'XL', 'XXL'])
      .withMessage("Size must be one of: S, M, L, XL, XXL"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { _id, quantity, size } = req.body;
    const userId = req.user.id;

    try {
      // Find the product
      const product = await Product.findById(_id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Validate that the requested size exists for this product
      const sizeExists = product.size.some(s => s.name === size);
      if (!sizeExists) {
        return res.status(400).json({ message: "Selected size is not available for this product" });
      }

      // Find or create cart
      let cart = await Cart.findOne({ userId });
      if (!cart) {
        cart = new Cart({
          userId,
          items: [],
          totalAmount: 0
        });
      }

      // Check if item with same product ID and size already exists in cart
      const itemIndex = cart.items.findIndex(item => 
        item._id.toString() === _id && item.size === size
      );

      if (itemIndex > -1) {
        // Item exists with same size, update quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Item doesn't exist with this size, add new item
        cart.items.push({
          _id,
          name: product.name,
          price: product.price,
          image: product.images[0],
          size: size,
          quantity
        });
      }

      // Recalculate total amount
      cart.totalAmount = cart.items.reduce(
        (total, item) => total + (item.price * item.quantity), 
        0
      );

      await cart.save();
      res.status(200).json(cart);
    } catch (error) {
      console.error("Error adding item to cart:", error);
      res.status(500).json({ message: "Error adding item to cart" });
    }
  }
);

/**
 * @swagger
 * /api/cart/deleteItem:
 *   delete:
 *     summary: Xóa một sản phẩm khỏi giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _id
 *             properties:
 *               _id:
 *                 type: string
 *                 description: ID của sản phẩm cần xóa
 *     responses:
 *       200:
 *         description: Sản phẩm đã được xóa khỏi giỏ hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 */
router.delete(
  "/cart/deleteItem",
  [
    auth,
    body("_id")
      .isMongoId()
      .withMessage("Invalid product ID format")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { _id } = req.body;
    const userId = req.user.id;

    try {
      // Find the cart
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      // Find the item
      const itemIndex = cart.items.findIndex(item => 
        item._id.toString() === _id
      );

      if (itemIndex === -1) {
        return res.status(404).json({ message: "Item not found in cart" });
      }

      // Remove the item
      cart.items.splice(itemIndex, 1);

      // Recalculate total amount
      cart.totalAmount = cart.items.reduce(
        (total, item) => total + (item.price * item.quantity), 
        0
      );

      await cart.save();
      res.status(200).json(cart);
    } catch (error) {
      console.error("Error removing item from cart:", error);
      res.status(500).json({ message: "Error removing item from cart" });
    }
  }
);

/**
 * @swagger
 * /api/cart/delete:
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Giỏ hàng đã được xóa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.delete(
  "/cart/delete",
  auth,
  async (req, res) => {
    const userId = req.user.id;

    try {
      // Find the cart
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      // Clear items and reset total
      cart.items = [];
      cart.totalAmount = 0;

      await cart.save();
      res.status(200).json({ message: "Cart cleared successfully" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Error clearing cart" });
    }
  }
);

export default router; 
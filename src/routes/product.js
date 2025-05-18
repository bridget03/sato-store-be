import express from "express";
import { body, param, query, validationResult } from "express-validator";
import Product from "../models/productModel.js";
import mongoose from "mongoose";
const router = express.Router();
//
/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API endpoints cho người dùng xem sản phẩm
 */

/**
 * @swagger
 * /api/product:
 *   get:
 *     summary: Lấy danh sách sản phẩm có phân trang và sắp xếp
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: ['0', '1', '2', '3', '4', '5']
 *         description: |
 *           Loại sắp xếp:
 *           * 0 - Mặc định
 *           * 3 - Mới nhất
 *           * 4 - Giá tăng dần
 *           * 5 - Giá giảm dần
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Số trang (mặc định là 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Số sản phẩm trên mỗi trang (mặc định là 10)
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 */
router.get(
  "/product",
  [
    query("sortType")
      .optional()
      .isIn(["0", "1", "2", "3", "4", "5"])
      .withMessage("Invalid sortType value (0-5)"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .toInt()
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1 })
      .toInt()
      .withMessage("Limit must be a positive integer"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { sortType, page = 1, limit = 100 } = req.query;

      let sortOptions = {};
      switch (sortType) {
        case "3":
          sortOptions = { createdAt: -1 };
          break;
        case "4":
          sortOptions = { price: 1 };
          break;
        case "5":
          sortOptions = { price: -1 };
          break;
        default:
          sortOptions = {};
          break;
      }

      const skip = (page - 1) * limit;

      const totalProducts = await Product.countDocuments();
      const products = await Product.find()
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        data: products,
        pagination: {
          currentPage: page,
          limit: limit,
          totalPages: Math.ceil(totalProducts / limit),
          totalItems: totalProducts,
        },
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Error fetching products" });
    }
  }
);

/**
 * @swagger
 * /api/product/{productId}:
 *   get:
 *     summary: Lấy thông tin chi tiết một sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Thông tin chi tiết sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Không tìm thấy sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get(
  "/product/:productId",
  [param("productId").isMongoId().withMessage("Invalid product ID format")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Log để kiểm tra ID
      console.log("Finding product with ID:", req.params.productId);

      // const product = await Product.findById(mongoose.Types.ObjectId(req.params.productId));
      const product = await Product.findOne({ _id: req.params.productId });

      if (!product) {
        console.log("Product not found in database");
        return res.status(404).json({ message: "Product not found" });
      }

      console.log("Product found:", product.name);
      res.status(200).json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Error fetching product" });
    }
  }
);

/**
 * @swagger
 * /api/related-products/{productId}:
 *   get:
 *     summary: Lấy danh sách sản phẩm liên quan
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm cần tìm sản phẩm liên quan
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm liên quan
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       404:
 *         description: Không tìm thấy sản phẩm gốc
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get(
  "/related-products/:productId",
  [param("productId").isMongoId().withMessage("Invalid product ID format")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const product = await Product.findById(req.params.productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Get related products from the same type, excluding the current product
      const relatedProducts = await Product.find({
        type: product.type,
        _id: { $ne: product._id },
      }).limit(10);

      res.status(200).json(relatedProducts);
    } catch (error) {
      console.error("Error fetching related products:", error);
      res.status(500).json({ message: "Error fetching related products" });
    }
  }
);

export default router;

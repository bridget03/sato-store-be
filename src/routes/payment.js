import express from "express";
import { body, validationResult } from "express-validator";
import qs from "qs";
import crypto from "crypto";
import moment from "moment";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import auth from "../middleware/auth.js";
import { vnpayConfig } from "../config/vnpay.js";

const router = express.Router();
//
/**
 * @swagger
 * /api/payment/create_payment_url:
 *   post:
 *     summary: Tạo URL thanh toán VNPAY từ giỏ hàng
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - fullName
 *                   - address
 *                   - city
 *                   - phone
 *                 properties:
 *                   fullName:
 *                     type: string
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   phone:
 *                     type: string
 */
router.post(
  "/create_payment_url",
  [
    auth,
    body("shippingAddress.fullName").notEmpty().trim(),
    body("shippingAddress.address").notEmpty().trim(),
    body("shippingAddress.city").notEmpty().trim(),
    body("shippingAddress.phone").notEmpty().trim(),
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Validate VNPAY config

      if (
        !vnpayConfig.tmnCode ||
        !vnpayConfig.hashSecret ||
        !vnpayConfig.url ||
        !vnpayConfig.returnUrl
      ) {
        console.error("Missing VNPAY configuration:", vnpayConfig);
        return res.status(500).json({
          success: false,
          message: "VNPAY configuration is missing",
        });
      }

      // Get cart
      const cart = await Cart.findOne({ userId: req.user.id });
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty",
        });
      }

      console.log("Cartttttttttttt", cart);
      // Create order
      const order = await Order.create({
        userId: req.user.id,
        items: cart.items,
        totalAmount: cart.totalAmount,
        shippingAddress: req.body.shippingAddress,
        paymentMethod: "vnpay",
      });

      // Create VNPAY payment URL
      const date = new Date();
      const createDate = moment(date).format("YYYYMMDDHHmmss");
      const orderId = moment(date).format("HHmmss");
      const amount = Math.round(cart.totalAmount) * 100; // Ensure amount is an integer

      const locale = "vn";
      const currCode = "VND";
      let vnp_Params = {};
      vnp_Params["vnp_Version"] = "2.1.0";
      vnp_Params["vnp_Command"] = "pay";
      vnp_Params["vnp_TmnCode"] = vnpayConfig.tmnCode;
      vnp_Params["vnp_Locale"] = locale;
      vnp_Params["vnp_CurrCode"] = currCode;
      vnp_Params["vnp_TxnRef"] = orderId;
      vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
      vnp_Params["vnp_OrderType"] = "other";
      vnp_Params["vnp_Amount"] = amount * 25000;
      vnp_Params["vnp_ReturnUrl"] = vnpayConfig.returnUrl;
      vnp_Params["vnp_IpAddr"] = req.ip;
      vnp_Params["vnp_CreateDate"] = createDate;

      // Debug logs
      console.log("VNPAY Config:", {
        tmnCode: vnpayConfig.tmnCode,
        returnUrl: vnpayConfig.returnUrl,
        url: vnpayConfig.url,
      });

      vnp_Params = sortObject(vnp_Params);

      const signData = qs.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac("sha512", vnpayConfig.hashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      vnp_Params["vnp_SecureHash"] = signed;

      // Debug logs
      console.log("VNPAY Parameters after signing:", vnp_Params);

      const vnpUrl =
        vnpayConfig.url + "?" + qs.stringify(vnp_Params, { encode: false });

      // Debug logs
      console.log("Final VNPAY URL:", vnpUrl);

      // Clear cart after creating order
      cart.items = [];
      cart.totalAmount = 0;
      await cart.save();

      res.json({
        success: true,
        data: {
          orderId: order._id,
          paymentUrl: vnpUrl,
        },
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({
        success: false,
        message: "Error creating payment",
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/payment/vnpay_return:
 *   get:
 *     summary: Xử lý kết quả thanh toán từ VNPAY
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *         required: true
 *         description: Mã phản hồi từ VNPAY
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema:
 *           type: string
 *         required: true
 *         description: Mã giao dịch VNPAY
 */
router.get("/vnpay_return", async (req, res) => {
  try {
    let vnp_Params = req.query;
    console.log("Received VNPAY return params:", vnp_Params);

    const secureHash = vnp_Params["vnp_SecureHash"];

    // Remove hash and hash type from params
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    // Sort params
    vnp_Params = sortObject(vnp_Params);

    // Calculate secure hash
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnpayConfig.hashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // Debug logs
    console.log("Calculated hash:", signed);
    console.log("Received hash:", secureHash);

    if (secureHash === signed) {
      const orderId = vnp_Params["vnp_TxnRef"];
      const rspCode = vnp_Params["vnp_ResponseCode"];
      const transactionNo = vnp_Params["vnp_TransactionNo"];

      // Find order created today with matching orderId
      const startOfDay = moment().startOf("day");
      const endOfDay = moment().endOf("day");

      console.log("Looking for order with ID pattern:", orderId);
      console.log("Time range:", startOfDay.toDate(), "to", endOfDay.toDate());

      const orders = await Order.find({
        createdAt: {
          $gte: startOfDay.toDate(),
          $lte: endOfDay.toDate(),
        },
      }).sort({ createdAt: -1 });

      console.log("Found orders:", orders.length);

      if (orders && orders.length > 0) {
        const order = orders[0]; // Get most recent order
        console.log("Processing order:", order._id);

        if (rspCode === "00") {
          // Payment successful
          order.paymentStatus = "completed";
          order.vnpayTransactionId = transactionNo;
          await order.save();

          return res.status(200).json({
            success: true,
            message: "Payment successful",
            data: {
              orderId: order._id,
              transactionId: transactionNo,
              amount: vnp_Params["vnp_Amount"],
              orderInfo: vnp_Params["vnp_OrderInfo"],
            },
          });
        } else {
          // Payment failed
          order.paymentStatus = "failed";
          await order.save();

          return res.status(400).json({
            success: false,
            message: "Payment failed",
            code: rspCode,
          });
        }
      } else {
        console.log("No matching order found");
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }
    } else {
      console.log("Invalid hash");
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }
  } catch (error) {
    console.error("Error processing payment return:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing payment return",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/payment/vnpay_ipn:
 *   get:
 *     summary: Xử lý IPN (Instant Payment Notification) từ VNPAY
 *     tags: [Payment]
 */
router.get("/vnpay_ipn", async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnpayConfig.hashSecret);
    const signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      const orderId = vnp_Params["vnp_TxnRef"];
      const rspCode = vnp_Params["vnp_ResponseCode"];

      // Kiểm tra và cập nhật trạng thái đơn hàng
      res.status(200).json({ RspCode: "00", Message: "success" });
    } else {
      res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
    }
  } catch (error) {
    res.status(200).json({ RspCode: "99", Message: "Unknown error" });
  }
});

// Helper function to sort object by key
function sortObject(obj) {
  const sorted = {};
  const str = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (const key of str) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }
  return sorted;
}

export default router;

import express from "express";
import { body, validationResult } from "express-validator";
import qs from "qs";
import crypto from "crypto";
import moment from "moment";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import auth from "../middleware/auth.js";
import { vnpayConfig } from "../config/vnpay.js";
import axios from "axios";

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
    console.log("Received payload:", req.body);
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
      const amount = Math.round(cart.totalAmount * 100); // Ensure amount is an integer

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
      vnp_Params["vnp_Amount"] = amount;
      vnp_Params["vnp_ReturnUrl"] = vnpayConfig.returnUrl;
      vnp_Params["vnp_IpAddr"] = req.ip;
      vnp_Params["vnp_CreateDate"] = createDate;

      vnp_Params = sortObject(vnp_Params);

      const signData = qs.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac("sha512", vnpayConfig.hashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      vnp_Params["vnp_SecureHash"] = signed;

      const vnpUrl =
        vnpayConfig.url + "?" + qs.stringify(vnp_Params, { encode: false });

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

          return res.redirect(`http://localhost:5173/order-success`);

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
          return res.redirect(
            `http://localhost:5173/order-fail?orderId=${order._id}`
          );

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
    let vnp_Params = { ...req.query }; // Clone object
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });

    const signed = crypto
      .createHmac("sha512", vnpayConfig.hashSecret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    if (secureHash === signed) {
      const orderId = vnp_Params["vnp_TxnRef"];
      const rspCode = vnp_Params["vnp_ResponseCode"];
      const transactionStatus = vnp_Params["vnp_TransactionStatus"];

      const order = await Order.findById(orderId);

      if (!order) {
        return res
          .status(200)
          .json({ RspCode: "01", Message: "Order not found" });
      }

      if (order.status === "paid") {
        return res
          .status(200)
          .json({ RspCode: "02", Message: "Order already paid" });
      }

      if (rspCode === "00" && transactionStatus === "00") {
        order.status = "paid";
        order.paymentMethod = "vnpay";
        order.paymentInfo = {
          vnpTransactionNo: vnp_Params["vnp_TransactionNo"],
          amount: Number(vnp_Params["vnp_Amount"]) / 100,
          payDate: vnp_Params["vnp_PayDate"],
        };
        await order.save();

        return res.status(200).json({ RspCode: "00", Message: "Success" });
      } else {
        order.status = "failed";
        await order.save();
        return res
          .status(200)
          .json({ RspCode: "00", Message: "Transaction failed" });
      }
    } else {
      return res
        .status(200)
        .json({ RspCode: "97", Message: "Invalid signature" });
    }
  } catch (error) {
    console.error("VNPay IPN error:", error);
    return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
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

//MOMO
router.post("/momo_payment", async (req, res) => {
  const orderId = req.body.orderId;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      console.error("Order not found for ID:", orderId);
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "completed") {
      console.error("Order already paid:", orderId);
      return res.status(400).json({ message: "Order already paid" });
    }

    const amount = Math.round(order.totalAmount).toString();
    const orderInfo = `Thanh toán đơn hàng ${orderId}`;
    const requestId = `${orderId}-${Date.now()}`;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const partnerCode = "MOMO";
    const redirectUrl =
      process.env.MOMO_REDIRECT_URL ||
      "https://a38c-59-153-220-56.ngrok-free.app/api/payment/momo_return";
    const ipnUrl =
      process.env.MOMO_IPN_URL ||
      "https://a38c-59-153-220-56.ngrok-free.app/api/payment/momo_ipn";
    const requestType = "payWithMethod";
    const orderGroupId = "";
    const autoCapture = true;
    const lang = "vi";
    const extraData = "";

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    console.log("MoMo rawSignature:", rawSignature); // Log để debug

    const requestBody = {
      partnerCode,
      partnerName: "Test",
      storeId: "MomoTestStore",
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      requestType,
      autoCapture,
      extraData,
      orderGroupId,
      signature,
    };

    console.log("MoMo request body:", requestBody);

    const options = {
      method: "POST",
      url: "https://test-payment.momo.vn/v2/gateway/api/create",
      headers: {
        "Content-Type": "application/json",
      },
      data: requestBody,
    };

    const result = await axios(options);
    console.log("MoMo response:", result.data);

    if (result.data.resultCode !== 0) {
      console.error("MoMo API error:", result.data);
      return res
        .status(400)
        .json({ message: result.data.message || "MoMo payment failed" });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    console.error("MoMo payment error:", error.response?.data || error.message);
    return res.status(500).json({
      message: "MoMo payment failed",
      error: error.response?.data || error.message,
    });
  }
});

router.post("/momo_ipn", async (req, res) => {
  const {
    resultCode,
    orderId,
    requestId,
    amount,
    message,
    signature,
    extraData,
    orderInfo,
    partnerCode,
    transId,
    orderType,
    payType,
    responseTime,
  } = req.body;
  const secretKey = process.env.MOMO_SECRET_KEY;

  // Tạo chữ ký theo tài liệu MoMo
  const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
  const calculatedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  console.log("MoMo IPN body:", req.body);
  console.log("MoMo IPN rawSignature:", rawSignature);
  console.log("Calculated signature:", calculatedSignature);
  console.log("MoMo signature:", signature);

  if (signature !== calculatedSignature) {
    console.error("Invalid MoMo signature");
    return res.status(200).json({ message: "Invalid signature" });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      console.error("Order not found:", orderId);
      return res.status(200).json({ message: "Order not found" });
    }

    if (order.paymentStatus === "completed") {
      console.log("Order already paid:", orderId);
      return res.status(200).json({ message: "Order already paid" });
    }

    if (resultCode == 0) {
      order.paymentStatus = "completed";
      order.paymentMethod = "momo";
      order.paymentInfo = {
        momoRequestId: requestId,
        amount,
        message,
        transId,
      };
      await order.save();
      console.log("Order updated to completed:", orderId);
    } else {
      order.paymentStatus = "failed";
      order.paymentInfo = { momoMessage: message || "Payment failed" };
      await order.save();
      console.log("Order updated to failed:", orderId);
    }

    return res.status(200).json({ message: "Success" });
  } catch (error) {
    console.error("MoMo IPN error:", error.message);
    return res.status(200).json({ message: "Unknown error" });
  }
});

// router.get("/momo_return", async (req, res) => {
//   const {
//     orderId,
//     resultCode,
//     message,
//     signature,
//     amount,
//     requestId,
//     transId,
//     extraData,
//     orderInfo,
//     partnerCode,
//     orderType,
//     payType,
//     responseTime,
//   } = req.query;
//   const secretKey = process.env.MOMO_SECRET_KEY;

//   const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
//   const calculatedSignature = crypto
//     .createHmac("sha256", secretKey)
//     .update(rawSignature)
//     .digest("hex");

//   console.log("MoMo return query:", req.query);
//   console.log("MoMo return rawSignature:", rawSignature);
//   console.log("Calculated signature:", calculatedSignature);
//   console.log("MoMo signature:", signature);

//   if (signature !== calculatedSignature) {
//     console.error("Invalid MoMo signature in return");
//     return res.status(200).json({
//       redirectUrl: `http://localhost:5173/order-fail?orderId=${orderId}`,
//     });
//   }

//   try {
//     const order = await Order.findById(orderId);
//     if (!order) {
//       console.error("Order not found:", orderId);
//       return res.status(200).json({
//         redirectUrl: `http://localhost:5173/order-fail?orderId=${orderId}`,
//       });
//     }

//     if (resultCode == 0) {
//       if (order.paymentStatus !== "completed") {
//         order.paymentStatus = "completed";
//         order.paymentMethod = "momo";
//         order.paymentInfo = {
//           momoRequestId: requestId,
//           amount,
//           message,
//           transId,
//         };
//         await order.save();
//         console.log("Order updated to completed:", orderId);
//       }
//       console.log(
//         "Returning redirect URL:",
//         `http://localhost:5173/order-success?orderId=${orderId}`
//       );
//       return res.status(200).json({
//         redirectUrl: `http://localhost:5173/order-success?orderId=${orderId}`,
//       });
//     } else {
//       order.paymentStatus = "failed";
//       order.paymentInfo = { momoMessage: message || "Payment failed" };
//       await order.save();
//       console.log("Order updated to failed:", orderId);
//       return res.status(200).json({
//         redirectUrl: `http://localhost:5173/order-fail?orderId=${orderId}`,
//       });
//     }
//   } catch (error) {
//     console.error("MoMo return error:", error.message);
//     return res.status(200).json({
//       redirectUrl: `http://localhost:5173/order-fail?orderId=${orderId}`,
//     });
//   }
// });

router.get("/momo_return", async (req, res) => {
  try {
    console.log("MoMo return query:", req.query);

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = req.query;

    const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const computedSignature = crypto
      .createHmac("sha256", process.env.MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest("hex");

    // Kiểm tra chữ ký
    if (computedSignature !== signature) {
      console.error("Invalid signature");
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Kiểm tra resultCode
    if (resultCode !== "0") {
      console.error("MoMo payment failed:", { resultCode, message });
      return res.redirect(302, `${process.env.FRONTEND_URL}/order-fail`);
    }

    // Tạo redirect URL
    const redirectUrl = `${
      process.env.FRONTEND_URL
    }/order-success?orderId=${encodeURIComponent(orderId)}`;
    console.log("Redirecting to:", redirectUrl);

    // Redirect tự động với status code 302
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error("Error in /momo_return:", error.message, error.stack);
    return res.redirect(302, `${process.env.FRONTEND_URL}/order-fail`);
  }
});

export default router;

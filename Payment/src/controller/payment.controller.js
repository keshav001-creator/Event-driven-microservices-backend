require('dotenv').config();
const Razorpay = require('razorpay');
const db = require("../config/mySql")
const axios = require("axios")
const { publishToQueue } = require('../broker/broker');

const razorpay = new Razorpay({
   key_id: process.env.RAZORPAY_KEY_ID,
   key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPayment(req, res) {

   const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1]

   try {
      const orderId = req.params.orderId;
      const userId = req.user.id;

      const orderResponse = await axios.get(`http://localhost:3003/api/${orderId}`, {
         headers: {
            Authorization: `Bearer ${token}`
         }  
      })

      //    console.log(orderResponse.data.order[0].total_price_amount)

      const price = orderResponse.data.order[0].total_price_amount
      const currency = orderResponse.data.order[0].total_price_currency

      //    console.log(typeof(price))

      const razorpayOrder = await razorpay.orders.create({
         amount: Number(price),
         currency: currency
      })

      // console.log(razorpayOrder)

      const [payment] = await db.execute(
         `INSERT INTO payments
        (order_id, razor_order_id,price_amount, price_currency, user_id)
        VALUES(?,?,?,?,?)`,
         [orderId, razorpayOrder.id, price, currency, userId]
      )

      // console.log(payment);
      return res.status(200).json({
         message: "Payment initiated successfully",
         payment: payment.insertId
      })

   } catch (err) {
      console.log(err)
      return res.status(500).json({
         message: "Internal server error",
         error: err.message
      })
   }

}

async function verifyPayment(req, res) {
   const { razorOrderId, razorpayPaymentId, signature } = req.body;
   const secret = process.env.RAZORPAY_KEY_SECRET;
   let finalPayment;

   try {
      const { validatePaymentVerification } = require('../../node_modules/razorpay/dist/utils/razorpay-utils.js')

      const isValid = validatePaymentVerification({
         order_id: razorOrderId,
         payment_id: razorpayPaymentId,
      }, signature, secret);

      if (!isValid) {
         return res.status(400).json({ message: "Payment invalid" })
      }

      const [payment] = await db.execute(
         `SELECT * FROM payments WHERE razor_order_id=? AND status=?`, [razorOrderId, "PENDING"]
      )

      finalPayment=payment;

      if (payment.length === 0) {
         return res.status(404).json({ message: "Payment not found" })
      }

      const [result] = await db.execute(
      `UPDATE payments 
      SET razorpay_payment_id=?, signature=?, status='COMPLETED'
      WHERE razor_order_id=? AND status='PENDING' `,
         [razorpayPaymentId, signature, razorOrderId]
      );

      if (result.affectedRows === 0) {
         return res.status(400).json({
            message: "Payment already processed or invalid",
         });
      }


      await Promise.all([
         publishToQueue("payment_completed_queue", {
            orderId: payment[0].order_id,
            paymentId: payment[0].id,
            amount: payment[0].price_amount,
            currency: payment[0].price_currency,
            email: req.user.email
         }),
         publishToQueue("payment_completed_sellerDashboard_queue", {
            orderId: payment[0].order_id,     //order_id of the order given in params
            paymentId: payment[0].id,
            amount: payment[0].price_amount,
            currency: payment[0].price_currency,
            email: req.user.email,
            username: req.user.username
         }),
         publishToQueue("order_payment_queue", {
            orderId: payment[0].order_id,
            status:"COMPLETED",
            userId: payment[0].user_id
         }),
         publishToQueue("payment_cart_queue", {
            userId: payment[0].user_id
         })

      ])





      return res.status(200).json({
         message: "Payment verified successfully"
      })



   } catch (err) {

      await publishToQueue("payment_failed_queue", {
         orderId: finalPayment?.order_id,
         paymentId: finalPayment?.id,
         amount: finalPayment?.price_amount,
         currency: finalPayment?.price_currency,
         email: req.user.email,
         username: req.user.username
      })

      return res.status(500).json({
         message: "Internal server error",
         err: err.message
      })
   }
}

module.exports = {
   createPayment, verifyPayment
}
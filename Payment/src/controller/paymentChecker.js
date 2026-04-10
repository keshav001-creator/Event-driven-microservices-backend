const cron = require("node-cron");
const db = require("../config/mySql");
const Razorpay = require("razorpay");
const { publishToQueue } = require("../broker/broker");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


async function checkPendingPayments() {

    const [pendingPayments] = await db.execute(
        `SELECT * FROM payments WHERE status='PENDING'`
    );

    for (const payment of pendingPayments) {
        try {

            const [user] = await db.execute(
                `SELECT email, username FROM users WHERE id=?`,
                [payment.user_id]
            );

            const userData = user[0];

            const response = await razorpay.orders.fetchPayments(
                payment.razor_order_id
            );

            const paid = response.items.find(p => p.status === "captured");

            if (paid) {

                const [result] = await db.execute(
                    `UPDATE payments SET status='COMPLETED', razorpay_payment_id=?
                WHERE razor_order_id=? AND status='PENDING'`,
                    [paid.id, payment.razor_order_id]
                );

                if (result.affectedRows === 0) {
                    console.log("Payment already processed or invalid for order:", payment.razor_order_id);
                    continue;
                }

                await Promise.all([
                    publishToQueue("order_payment_queue", {
                        orderId: payment.order_id,
                        status: "COMPLETED",
                        userId: payment.user_id
                    }),
                    publishToQueue("payment_completed_queue", {
                        orderId: payment.order_id,
                        paymentId: payment.id,
                        amount: payment.price_amount,
                        currency: payment.price_currency,
                        email: userData.email
                    }),
                    publishToQueue("payment_completed_sellerDashboard_queue", {
                        orderId: payment.order_id,     //order_id of the order given in params
                        paymentId: payment.id,
                        amount: payment.price_amount,
                        currency: payment.price_currency,
                        email: userData.email,
                        username: userData.username
                    }),
                    publishToQueue("payment_cart_queue", {
                        userId: payment.user_id
                    })
                ]);

                console.log("Recovered payment:", payment.id);
            }

        } catch (err) {
            console.log("Error checking payment:", err.message);
        }
    }
}

cron.schedule("*/2 * * * *", async () => {
    console.log("Running payment recovery job...");
    await checkPendingPayments();
});
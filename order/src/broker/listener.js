const { subscribeToQueue } = require("../broker/broker");
const db = require("../config/mysql")

module.exports = function () {

    subscribeToQueue("order_payment_queue", async (data) => {
        const orderId = data.orderId;
        const status = data.status;
        const userId = data.userId;
        try {
            if(status === "FAILED"){
                await db.execute(   
                    `UPDATE orders SET status=? WHERE order_id=? AND user_id=?`, [status, orderId, userId]
                )
                return;
            }
            const [result] = await db.execute(
                `UPDATE orders SET status=? WHERE order_id=? AND user_id=?`, [status, orderId, userId]
            )
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Order not found or already updated" });
            }
        } catch (err) {
            console.error("Error updating order status:", err);
        }
    });
}
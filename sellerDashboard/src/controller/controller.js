const db = require("../config/mySql")

async function getMetrics(req, res) {
    try {
        const sellerId = req.user?.id

        if (!sellerId) {
            return res.status(401).json({
                message: "Unauthorized - Seller ID not found",
            })
        }

        // Get Sales Count
        const [salesResult] = await db.execute(
            `SELECT COUNT(*) as totalSales 
            FROM seller_orders 
            WHERE seller_id = ?`,
            [sellerId]
        );
        const totalSales = salesResult[0]?.totalSales || 0

        // Get Revenue (sum of order amounts)
        const [revenueResult] = await db.execute(
            `SELECT SUM(total_amount) as totalRevenue 
            FROM seller_orders 
            WHERE seller_id = ?`,
            [sellerId]
        );
        const totalRevenue = revenueResult[0]?.totalRevenue || 0

        // Get Top Products
        const [topProducts] = await db.execute(
            `SELECT soi.product_id, 
                  SUM(soi.quantity) AS totalSold
           FROM seller_order_items soi
           JOIN seller_orders so 
             ON soi.seller_order_id = so.id
           WHERE so.seller_id = ?
           GROUP BY soi.product_id
           ORDER BY totalSold DESC
           LIMIT 5`,
            [sellerId]
        );
        return res.status(200).json({
            message: "Metrics fetched successfully",
            data: {
                sales: totalSales,
                revenue: totalRevenue,
                topProducts: topProducts || []
            }
        })

    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        })
    }
}

async function getOrders(req, res) {
    try {
        const sellerId = req.user?.id

        if (!sellerId) {
            return res.status(401).json({
                message: "Unauthorized - Seller ID not found",
            })
        }
        const [orders] = await db.execute(
            `SELECT * FROM seller_orders WHERE seller_id = ?`,
            [sellerId]
        );
        return res.status(200).json({
            message: "Orders fetched successfully",
            data: orders || []
        })

    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        })
    }

}

async function getProducts(req, res) {

    try{
        const sellerId = req.user?.id
        if (!sellerId) {
            return res.status(401).json({
                message: "Unauthorized - Seller ID not found",
            })
        }

        const [products] = await db.execute(
            `SELECT * FROM seller_products WHERE seller_id = ?`,
            [sellerId]
         );

        return res.status(200).json({
            message: "Products fetched successfully",
            data: products || []
         })

    }catch(err){
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
            })
    }

}

module.exports = { getMetrics, getOrders, getProducts }



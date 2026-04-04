const db = require("../config/mysql")
const { uploadImage } = require("../service/imagekit")
const { publishToQueue } = require("../broker/broker")

async function createProduct(req, res) {

    try {

        const { title, description, priceAmount, priceCurrency,stock } = req.body

        const seller = req.user.id

        // const price = {
        //     amount: Number(priceAmount),
        //     currency: priceCurrency
        // }


        const uploadedImages = await Promise.all(
            (req.files || []).map(file => uploadImage({ buffer: file.buffer }))    //map returns an array
        )
        console.log("Uploaded Images:", uploadedImages);

        const [result] = await db.execute(
            `INSERT INTO product_table 
            (title, description, price_amount, price_currency, seller_id,stock)
            VALUES (?,?,?,?,?,?)`,
            [title, description, Number(priceAmount), priceCurrency, seller,stock]
        )

        await publishToQueue("product_sellerDashboard_queue", {
            product_id: result.insertId,
            title,
            description,    
            price_amount: Number(priceAmount),
            price_currency: priceCurrency,
            seller_id: seller,
            stock: stock  
        })
        // console.log("result:", result.insertId)

        // const product = await productModel.create({
        //     title,
        //     description,
        //     price,
        //     seller,
        //     images: uploadedImages
        // })

        for (let img of uploadedImages) {
            await db.execute(
                `INSERT INTO product_image 
                (product_id, url, thumbnail, image_ref_id)
                VALUES (?, ?, ?, ?)`,
                [result.insertId, img.url, img.thumbnail, img.id]
            );
        }


        return res.status(201).json({
            message: "product created",
            // data: product
        })


    } catch (err) {
        console.log("create product error", err)
        res.status(500).json({ message: "Internal server error" })
    }

}


// async function getProducts(req, res) {

//     const { q, minprice, maxprice, skip = 0, limit = 20 } = req.query

//     const filter = {}

//     if (q) {
//         filter.$text = { $search: q }
//     }

//     if (minprice) {
//         filter["price.amount"] = { ...filter["price.amount"], $gte: Number(minprice) }
//     }

//     if (maxprice) {
//         filter["price.amount"] = { ...filter["price.amount"], $lte: Number(maxprice) }
//     }

//     const products = await productModel.find(filter).skip(Number(skip)).limit(Math.min(Number(limit), 20))

//     return res.status(200).json({ data: products })

// }

async function getProducts(req, res) {
    try {

        const { q, minprice, maxprice } = req.query;

        const skip = Number(req.query.skip) || 0;
        const limit = Math.min(Number(req.query.limit) || 20, 20);

        let query = `SELECT * FROM product_table WHERE 1=1`;
        const values = [];

        if (q) {
            query += ` AND title LIKE ?`;
            values.push(`%${q}%`);
        }

        if (minprice) {
            query += ` AND price_amount >= ?`;
            values.push(Number(minprice));
        }

        if (maxprice) {
            query += ` AND price_amount <= ?`;
            values.push(Number(maxprice));
        }

        query += ` LIMIT ? OFFSET ?`;
        values.push(limit, skip);

        const [rows] = await db.execute(query, values);

        return res.status(200).json({
            data: rows
        });

    } catch (err) {
        console.log("Get products error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getProductbyId(req, res) {

    const { id } = req.params

    // const Product = await productModel.findOne({_id:id})

    const [row] = await db.execute(
        `SELECT * FROM product_table WHERE product_id=?`,
        [id]
    )

    if (row.length === 0) {
        return res.status(404).json("Product not found")
    }

    res.status(200).json({
        message: "Product fetched successfully",
        row
    })
}

async function updateProduct(req, res) {

    const productId = req.params.id;
    const userId=req.user.id;

    // if (!mongoose.Types.ObjectId.isValid(id)) {
    //     return res.status(400).json({ message: "id is not valid" })
    // }

    // const Product = await findOne({
    //     _id: id,
    //     seller: req.user.id
    // })

    // if (!Product) {
    //     return res.status(404).json({ message: "Product not found" })
    // }

    // const allowedUpdates = ["title", "description", "price"]

    // for (const key of Object.keys(req.body)) {
    //     if (allowedUpdates.includes(key)) {
    //         if (key === "price" && typeof req.body.price === "object") {
    //             if (req.body.price.amount !== undefined) {
    //                 Product.price.amount = Number(req.body.price.amount)
    //             }
    //             if (req.body.price.currency !== undefined) {
    //                 Product.price.currency = req.body.price.currency
    //             }
    //         } else {
    //             Product[key] = req.body[key]
    //         }
    //     }
    // }
    // await Product.save()

    const {title, description, priceAmount, priceCurrency, stock}=req.body;

    const [rows]=await db.execute(
        `SELECT seller_id FROM product_table 
        WHERE product_id=?`,
        [productId]
    )

    if(rows.length===0){
        return res.status(404).json({
            message:"Products not found"
        })
    }

    if(rows[0].seller_id!==userId){
        return res.status(403).json({message:"Forbidden you can update only your product"})
    }

    await db.execute(
        `UPDATE product_table 
        SET title=?, description=?, price_amount=?, price_currency=?, stock=? 
        WHERE product_id=?`,
        [title,description,Number(priceAmount),priceCurrency,stock,productId]
    )

    return res.status(200).json({ message: "Product updated"})

}

async function deleteProduct(req, res) {

    const { id } = req.params

    // const Product=await productModel.findOne({_id:id})

    const [rows] = await db.execute(
        `SELECT product_id, seller_id FROM product_table 
        WHERE product_id=?`,
        [id]
    )

    if (rows.length === 0) {
        return res.status(404).json({ message: "Product not found" })
    }

    // if(!Product.seller.toString()!==req.user.id){
    //     return res.status(403).json({message:"Forbidden: You can delete only your own product"})
    // }
    if (rows[0].seller_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You can delete only your own product" })
    }

    // await productModel.deleteOne({ _id: id })

    await db.execute(
        `DELETE FROM product_table WHERE product_id=?`, [id]
    )

    return res.status(200).json({ message: "Product Deleted" })

}

async function productsBySeller(req, res) {

    try {

        const sellerId = req.user.id;

        const skip = Number(req.query.skip) || 0;
        const limit = Math.min(Number(req.query.limit) || 20, 20);

        const [rows] = await db.execute(
            `SELECT * FROM product_table
            WHERE seller_id = ?
            LIMIT ? OFFSET ?`,
            [sellerId, limit, skip]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Products not found" });
        }

        return res.status(200).json({ message: "Products fetched successfully", data: rows })

    } catch (err) {
        console.log("Fetch products error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { createProduct, getProducts, getProductbyId, updateProduct, deleteProduct, productsBySeller }
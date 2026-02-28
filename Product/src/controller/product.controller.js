const productModel = require("../model/product.model")
const { uploadImage } = require("../service/imagekit")

async function createProduct(req, res) {

    try {

        const { title, description, priceAmount, priceCurrency } = req.body

        if (!title || !priceAmount || !description) {
            return res.status(400).json({ message: "title, description, priceAmount is required" })
        }

        const seller = req.user.id

        const price = {
            amount: Number(priceAmount),
            currency: "INR"
        }


        const uploadedImages = await Promise.all(
            (req.files || []).map(file => uploadImage({ buffer: file.buffer }))    //map returns an array
        )

        const product = await productModel.create({
            title,
            description,
            price,
            seller,
            images: uploadedImages
        })

        return res.status(201).json({
            message: "product created",
            data: product
        })


    } catch (err) {
        console.log("create product error", err)
        res.status(500).json({ message: "Internal server error" })
    }

}


async function getProducts(req, res) {

    const { q, minprice, maxprice, skip = 0, limit = 20 } = req.query

    const filter = {}

    if (q) {
        filter.$text = { $search: q }
    }

    if (minprice) {
        filter["price.amount"] = { ...filter["price.amount"], $gte: Number(minprice) }
    }

    if (maxprice) {
        filter["price.amount"] = { ...filter["price.amount"], $lte: Number(maxprice) }
    }

    const products = await productModel.find(filter).skip(Number(skip)).limit(Math.min(Number(limit), 20))

    return res.status(200).json({ data: products })

}

async function getProductbyId(req, res) {

    const { id } = req.params

    const Product = await productModel.findOne({_id:id})

    if (!Product) {
        return res.status(404).json("Product not found")
    }

    res.status(200).json({
        message: "Product fetched successfully"
    })
}

async function updateProduct(req, res) {

    const id = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "id is not valid" })
    }

    const Product = await findOne({
        _id: id,
        seller: req.user.id
    })

    if (!Product) {
        return res.status(404).json({ message: "Product not found" })
    }

    const allowedUpdates = ["title", "description", "price"]

    for (const key of Object.keys(req.body)) {
        if (allowedUpdates.includes(key)) {
            if (key === "price" && typeof req.body.price === "object") {
                if (req.body.price.amount !== undefined) {
                    Product.price.amount = Number(req.body.price.amount)
                }
                if (req.body.price.currency !== undefined) {
                    Product.price.currency = req.body.price.currency
                }
            } else {
                Product[key] = req.body[key]
            }
        }
    }
    await Product.save()



    return res.status(200).json({message:"Product updated",Product})

}

async function deleteProduct(req,res){

    const {id}=req.params

    const Product=await productModel.findOne({_id:id})

    if(!Product){
        return res.status(404).json({message:"Product not found"})
    }

    if(!Product.seller.toString()!==req.user.id){
        return res.status(403).json({message:"Forbidden: You can delete only your own product"})
    }

    await productModel.deleteOne({_id:id})

    return res.status(200).json({message:"Product Deleted"})

}

async function productsBySeller(req,res){

    const{id}=req.user.id

    const {skip=0, limit=20}=req.query

    const Products=await productModel.find({
        seller:id
    }).skip(skip).limit(Math.min(limit,20))

    if(!Products){
        return res.status(404).json({message:"Products not found"})
    }

    return res.status(200).json({message:"Products fetched successfully",data:Products})
}

module.exports = { createProduct, getProducts, getProductbyId, updateProduct, deleteProduct, productsBySeller}
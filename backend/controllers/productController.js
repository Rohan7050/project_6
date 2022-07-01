const productModel = require('../models/productModel')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncError = require("../middleware/catchAsyncError")
const ApiFeatures = require('../utils/apiFeatures')

// get all products
module.exports.getAllProducts = catchAsyncError(async function (req, res, next) {
    const resultPerPage = 6
    const productCount = await productModel.countDocuments()
    const apifeature = new ApiFeatures(productModel.find(), req.query)
        .search()
        .filter()
        .pagination(resultPerPage)
    const product = await apifeature.query
    res.status(200).json({success: true, product: product, productCount})
})

// get product details
module.exports.getProductDetails = catchAsyncError(async function (req, res, next) { 
    const product = await productModel.findById(req.params.id)
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    res.status(200).json({ success: true, product })
})

// create product --admin 
module.exports.createProduct = catchAsyncError(async function (req, res, next) { 
    req.body.user = req.user.id
    const product = await productModel.create(req.body)
    res.status(201).json({success: true, product: product})
})

// update product --admin
module.exports.updateProduct = catchAsyncError(async function (req, res, next) { 
    let product = await productModel.findById(req.params.id)
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    product = await productModel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })
    res.status(200).json({ success: true, product })
})

// delete product
module.exports.deleteProduct = catchAsyncError(async function (req, res, next) { 
    const product = await productModel.findById(req.params.id)
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    await product.remove()
    res.status(200).json({ success: true, message: "product is remove" })
})
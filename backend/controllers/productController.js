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
    // console.log(apifeature.query.toString())
    res.status(200).json({
        success: true,
        product: product,
        productCount
    })
})

// get product details
module.exports.getProductDetails = catchAsyncError(async function (req, res, next) {
    const product = await productModel.findById(req.params.id)
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    res.status(200).json({
        success: true,
        product
    })
})

// create product --admin 
module.exports.createProduct = catchAsyncError(async function (req, res, next) {
    req.body.user = req.user.id
    const product = await productModel.create(req.body)
    res.status(201).json({
        success: true,
        product: product
    })
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
    res.status(200).json({
        success: true,
        product
    })
})

// delete product
module.exports.deleteProduct = catchAsyncError(async function (req, res, next) {
    const product = await productModel.findById(req.params.id)
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    await product.remove()
    res.status(200).json({
        success: true,
        message: "product is remove"
    })
})

// create and update review
module.exports.createProductReview = catchAsyncError(async function (req, res, next) {
    const {
        rating,
        comment,
        productId
    } = req.body
    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment
    }
    const product = await productModel.findById(productId)
    const isReviewed = product.reviews.find(rev => rev.user.toString() === req.user._id.toString())
    if (isReviewed) {
        product.reviews.forEach(review => {
            if (review.user.toString() === req.user._id.toString()) {
                review.rating = rating;
                review.comment = comment;
            }
        })
    } else {
        product.reviews.push(review)
        product.numOfReviews = product.reviews.length
    }
    let avg = 0
    product.reviews.forEach(rev => {
        avg += rev.rating;
    });
    product.ratings = avg / product.reviews.length;
    await product.save({
        validateBeforeSave: false
    })
    res.status(200).json({
        success: true
    })
})

// get all the reviews
module.exports.getAllReviews = catchAsyncError(async (req, res, next) => {
    const product = await productModel.findById(req.query.id)
    if (!product) {
        return next(new ErrorHandler("Product not found", 404))
    }
    res.status(200).json({
        success: true,
        reviews: product.reviews
    })
})

// delete review
exports.deleteReview = catchAsyncError(async (req, res, next) => {
    const product = await productModel.findById(req.query.productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    const reviews = product.reviews.filter(
        (rev) => rev._id.toString() !== req.query.id.toString()
    );
    let avg = 0;
    reviews.forEach((rev) => {
        avg += rev.rating;
    });
    let ratings = 0;
    if (reviews.length === 0) {
        ratings = 0;
    } else {
        ratings = avg / reviews.length;
    }
    const numOfReviews = reviews.length;
    await productModel.findByIdAndUpdate(
        req.query.productId, {
            reviews,
            ratings,
            numOfReviews,
        }, {
            new: true,
            runValidators: true,
            useFindAndModify: false,
        }
    );
    res.status(200).json({
        success: true,
        message: "review is remove"
    });
});
const orderModel = require('../models/orderModel')
const productModel = require('../models/productModel')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncError = require("../middleware/catchAsyncError")
const ApiFeatures = require('../utils/apiFeatures')

// Create new Order
exports.newOrder = catchAsyncError(async (req, res, next) => {
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    const order = await orderModel.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paidAt: Date.now(),
        user: req.user._id,
    });

    res.status(201).json({
        success: true,
        order,
    });
});

// get single order
module.exports.getSingleOrder = catchAsyncError(async  (req, res, next) => { 
    const order = await orderModel.findById(req.params.id).populate("user", "name email")
    if (!order) {
        return next(new ErrorHandler('order not found with this id', 404));
    }
    res.status(200).json({ success: true, order })
})

// find all order for logged in user
module.exports.myOrders = catchAsyncError(async (req, res, next) => {
    const orders = await orderModel.find({ user: req.user._id });
    console.log(req.user)
  
    res.status(200).json({success: true, orders });
});
  
// get all orders --admin
module.exports.getAllOrders = catchAsyncError(async (req, res, next) => {
    const orders = await orderModel.find().populate("user", "name email");
    let totalAmount = 0;
    orders.forEach((order) => {
        totalAmount += order.totalPrice;
    });
    res.status(200).json({
        success: true,
        totalAmount,
        orders,
    });
});

// update Order Status -- Admin
exports.updateOrder = catchAsyncError(async (req, res, next) => {
    const order = await orderModel.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandler("Order not found with this Id", 404));
    }
    if (order.orderStatus === "Delivered") {
        return next(new ErrorHandler("You have already delivered this order", 400));
    }
    if (req.body.status === "Shipped") {
        order.orderItems.forEach(async (odr) => {
            await updateStock(odr.product, odr.quantity);
        });
    }
    order.orderStatus = req.body.status;
    if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
    }
    await order.save({ validateBeforeSave: false});
    res.status(200).json({success: true});
});

async function updateStock(id, quantity) {
    const product = await productModel.findById(id)
    product.Stock -= quantity
    await product.save({validateBeforeSave: false})
}

// delete Order -- Admin
exports.deleteOrder = catchAsyncError(async (req, res, next) => {
    const order = await orderModel.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandler("Order not found with this Id", 404));
    }
    await order.remove();
    res.status(200).json({success: true,});
});
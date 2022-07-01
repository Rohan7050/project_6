const usertModel = require('../models/userModel')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncError = require("../middleware/catchAsyncError")
const userModel = require('../models/userModel')
const sendToken = require('../utils/jwtToken')
const sendEmail = require('../utils/sendEmail')

module.exports.registerUser = catchAsyncError(async function (req, res, next) {
    const {name, email, password} = req.body
    const user = await usertModel.create({
        name,
        email,
        password,
        avatar: {
            public_id: "this is public id",
            url: "public url"
        }
    })
    sendToken(user, 201, res)
})

module.exports.loginUser = catchAsyncError(async function (req, res, next) { 
    const { email, password } = req.body
    if (!email || !password) {
        return next(new ErrorHandler("please enter email or password", 400))
    }
    const user = await userModel.findOne({ email: email }).select('+password')
    if (!user) {
        return next(new ErrorHandler("please valid email or password1", 401))
    }
    const isPasswordMatched = await user.comparePassword(password)
    if (!isPasswordMatched) {
        return next(new ErrorHandler("please valid email or password2", 401))
    }
    sendToken(user, 200, res)
})

module.exports.logout = catchAsyncError(async function (req, res, next) {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        
    })
    res.status(200).json({ success: true, message: "Logged Out" })
})

// forget password
module.exports.forgetPassword = catchAsyncError(async function (req, res, next) { 
    const user = await userModel.findOne({ email: req.body.email })
    if (!user) {
        return next(new ErrorHandler("user not found with this email", 404))
    }
    const resetToken = user.getResetPasswordToken()
    await user.save({ validateBeforeSave: false })

    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`
    const message = `your password reset token is :- \n\n ${resetPasswordUrl} \n\n Ignore if you did not req this`
    try {
        await sendEmail({
            email: user.email,
            subject: "Ecommerce password recovery",
            message
        })
        res.status(200).json({success: true, message: `email send to ${user.email} successfully`})
    } catch (error) {
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined
        await user.save({ validateBeforeSave: false })
        return new next(ErrorHandler(error.message, 500))
    }
})
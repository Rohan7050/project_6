const usertModel = require('../models/userModel')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncError = require("../middleware/catchAsyncError")
const userModel = require('../models/userModel')
const sendToken = require('../utils/jwtToken')
const sendEmail = require('../utils/sendEmail')
const crypto = require("crypto");

// register user
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

// login user
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

// logout user
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
        // await sendEmail({
        //     email: user.email,
        //     subject: "Ecommerce password recovery",
        //     message
        // })
        res.status(200).json({success: true, message: `email send to ${user.email} successfully`, link: message})
    } catch (error) {
        // user.resetPasswordToken = undefined
        // user.resetPasswordExpire = undefined
        // await user.save({ validateBeforeSave: false })
        return next(new ErrorHandler(error.message, 500))
    }
})

// reset password
module.exports.resetPassword = catchAsyncError(async (req, res, next) => {
    // creating token hash
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
  
    const user = await userModel.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
  
    if (!user) {
      return next(
        new ErrorHandler(
          "Reset Password Token is invalid or has been expired",
          400
        )
      );
    }
  
    if (req.body.password !== req.body.confirmPassword) {
      return next(new ErrorHandler("Password does not password", 400));
    }
  
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
  
    await user.save();
  
    sendToken(user, 200, res);
});
  
// get own details
module.exports.getUserDetails = catchAsyncError(async function (req, res, next) { 
    const user = await userModel.findById(req.user.id)
    res.status(200).json({success: true, user})
})

// update Password for login user
module.exports.updatePassword = catchAsyncError(async (req, res, next) => {
    const user = await userModel.findById(req.user.id).select("+password");
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect", 400));
    }
    if (req.body.newPassword !== req.body.confirmPassword) {
        return next(new ErrorHandler("password does not match", 400));
    }
    user.password = req.body.newPassword;
    await user.save();
    sendToken(user, 200, res);
});
  
// update profile for login user
module.exports.updateProfile = catchAsyncError(async (req, res, next) => { 
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
    }

    const user = await userModel.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });
    res.status(200).json({success: true, message: user})
})

// get all user -- admin
module.exports.getAllUsers = catchAsyncError(async function (req, res, next) { 
    const user = await userModel.find()
    res.status(200).json({ success: true, user })
})

// get single user -- admin
module.exports.getSingleUser = catchAsyncError(async function (req, res, next) { 
    const user = await userModel.findById(req.params.id)
    if (!user) {
        return next(new ErrorHandler("user not found", 404))
    }
    res.status(200).json({ success: true, user })
})

// update user -- admin
module.exports.updateUser = catchAsyncError(async function (req, res, next) {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    }
    const user = await userModel.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });
    res.status(200).json({success: true, message: user})
})

// delete user -- admin
module.exports.deleteUser = catchAsyncError(async function (req, res, next) { 
    const user = await userModel.findById(req.params.id)
    if (!user) {
        return next(new ErrorHandler("user not found", 404))
    }
    if (user.role == "admin") {
        return next(new ErrorHandler("cannot remove admin", 403))
    }
    await user.remove()
    res.status(200).json({ success: true, message: "user deleted successfully" })
})




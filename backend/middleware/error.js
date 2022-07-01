const ErrorHandler = require('../utils/errorHandler');

module.exports = function (err, req, res, next) { 
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    // handle mongodb errors
    if (err.name == "CastError") {
        const message = `response not found, Invalid: ${err.path}`;
        err = new ErrorHandler(message, 400)
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    })
}
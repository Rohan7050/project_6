const express = require('express')

const {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductDetails,
    createProductReview,
    getAllReviews,
    deleteReview
} = require("../controllers/productController")
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth')

const router = express.Router()

router.get("/products", getAllProducts)

router.get("/products/:id", getProductDetails)

router.post("/admin/products/new", isAuthenticatedUser, authorizeRoles("admin"), createProduct)

router.put("/admin/products/:id", isAuthenticatedUser, authorizeRoles("admin"), updateProduct)

router.delete("/admin/products/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteProduct)

router.put("/reviews", isAuthenticatedUser, createProductReview)

router.get("/reviews", getAllReviews)

router.delete("/reviews", isAuthenticatedUser, deleteReview)

module.exports = router
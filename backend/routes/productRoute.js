const express = require('express')

const { getAllProducts, createProduct, updateProduct, deleteProduct, getProductDetails } = require("../controllers/productController")
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth')

const router = express.Router()

router.get("/products", getAllProducts)

router.get("/products/:id", getProductDetails)

router.post("/products/new", isAuthenticatedUser, authorizeRoles("admin"), createProduct)

router.put("/products/:id", isAuthenticatedUser, authorizeRoles("admin"), updateProduct)

router.delete("/products/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteProduct)


module.exports = router
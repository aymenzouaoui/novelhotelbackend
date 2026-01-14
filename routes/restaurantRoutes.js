const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload"); // ⬅️ Import your upload middleware

const {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant
} = require("../controllers/restaurantController");

// Apply middleware to handle image uploads
router.post("/", upload.single("image"), createRestaurant);
router.get("/", getAllRestaurants);
router.get("/:id", getRestaurantById);
router.put("/:id", upload.single("image"), updateRestaurant);
router.delete("/:id", deleteRestaurant);

module.exports = router;

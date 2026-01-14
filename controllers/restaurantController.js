const Restaurant = require("../models/Restaurant");

exports.createRestaurant = async (req, res) => {
  try {
    const { name, description, reservable } = req.body;
    const image = req.file ? req.file.path : "";

    const restaurant = new Restaurant({ 
      name, 
      description, 
      image, 
      reservable: reservable !== undefined ? reservable : true // default true
    });
    await restaurant.save();

    const io = req.app.get("io");
    io.emit("restaurantCreated", restaurant);

    res.status(201).json(restaurant);
  } catch (err) {
    console.error("❌ Error creating restaurant:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.status(200).json(restaurants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    res.status(200).json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const { name, description, reservable } = req.body;
    const updateFields = { name, description };

    if (req.file) {
      updateFields.image = req.file.path;
    }

    if (reservable !== undefined) {
      updateFields.reservable = reservable;
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const io = req.app.get("io");
    io.emit("restaurantUpdated", restaurant);

    res.status(200).json(restaurant);
  } catch (err) {
    console.error("❌ Error updating restaurant:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const io = req.app.get("io");
    io.emit("restaurantDeleted", restaurant._id);

    res.status(200).json({ message: "Restaurant deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

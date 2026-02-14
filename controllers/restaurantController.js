const Restaurant = require("../models/Restaurant");

const SUPPORTED_LANGS = ["fr", "ar"];

function parseTranslations(translations) {
  if (!translations) return null;
  if (typeof translations === "object") return translations;
  if (typeof translations !== "string") return null;
  try {
    return JSON.parse(translations);
  } catch {
    return null;
  }
}

function resolveRestaurantForLang(restaurant, lang) {
  if (!restaurant || !lang || !SUPPORTED_LANGS.includes(lang)) return restaurant;
  const doc = restaurant.toObject ? restaurant.toObject() : { ...restaurant };
  const t = doc.translations && doc.translations[lang];
  if (!t) return doc;
  return {
    ...doc,
    name: (t.name && String(t.name).trim()) ? t.name : doc.name,
    description: (t.description != null && String(t.description) !== "") ? t.description : doc.description,
  };
}

exports.createRestaurant = async (req, res) => {
  try {
    const { name, description, reservable, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);
    const image = req.file ? req.file.path : "";

    const restaurant = new Restaurant({
      name,
      description,
      image,
      reservable: reservable !== undefined ? reservable : true,
      translations: {
        fr: (translations && translations.fr)
          ? { name: String(translations.fr.name ?? "").trim(), description: translations.fr.description != null ? String(translations.fr.description) : "" }
          : { name: "", description: "" },
        ar: (translations && translations.ar)
          ? { name: String(translations.ar.name ?? "").trim(), description: translations.ar.description != null ? String(translations.ar.description) : "" }
          : { name: "", description: "" },
      },
    });
    await restaurant.save();

    const io = req.app.get("io");
    io.emit("restaurantCreated", restaurant);

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(201).json(lang ? resolveRestaurantForLang(restaurant, lang) : restaurant);
  } catch (err) {
    console.error("❌ Error creating restaurant:", err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllRestaurants = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const restaurants = await Restaurant.find();
    const payload = lang ? restaurants.map((r) => resolveRestaurantForLang(r, lang)) : restaurants;
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRestaurantById = async (req, res) => {
  try {
    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    res.status(200).json(lang ? resolveRestaurantForLang(restaurant, lang) : restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const { name, description, reservable, translations: rawTranslations } = req.body;
    const translations = parseTranslations(rawTranslations);
    const updateFields = { name, description };

    if (req.file) {
      updateFields.image = req.file.path;
    }
    if (reservable !== undefined) {
      updateFields.reservable = reservable;
    }
    if (translations && typeof translations === "object") {
      if (translations.fr != null) {
        updateFields["translations.fr"] = {
          name: String(translations.fr.name ?? "").trim(),
          description: translations.fr.description != null ? String(translations.fr.description) : "",
        };
      }
      if (translations.ar != null) {
        updateFields["translations.ar"] = {
          name: String(translations.ar.name ?? "").trim(),
          description: translations.ar.description != null ? String(translations.ar.description) : "",
        };
      }
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const io = req.app.get("io");
    io.emit("restaurantUpdated", restaurant);

    const lang = req.query.lang && SUPPORTED_LANGS.includes(req.query.lang) ? req.query.lang : null;
    res.status(200).json(lang ? resolveRestaurantForLang(restaurant, lang) : restaurant);
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

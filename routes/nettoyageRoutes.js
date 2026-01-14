const express = require("express");
const router = express.Router();
const nettoyageController = require("../controllers/nettoyageController");

router.post("/", nettoyageController.createNettoyage);
router.get("/", nettoyageController.getAllNettoyages);
router.get("/:id", nettoyageController.getNettoyageById);
router.put("/:id", nettoyageController.updateNettoyage);
router.delete("/:id", nettoyageController.deleteNettoyage);

module.exports = router;

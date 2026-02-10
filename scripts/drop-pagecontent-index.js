/**
 * Script à exécuter UNE FOIS pour supprimer l’index unique sur pageName.
 * Permet d’avoir plusieurs contenus avec le même pageName.
 *
 * Sur le serveur (où tourne l’API) : node scripts/drop-pagecontent-index.js
 */
require("dotenv").config();
const connectDB = require("../config/db");
const mongoose = require("mongoose");

async function run() {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    const collection = db.collection("pagecontents");

    const indexes = await collection.indexes();
    const hasPageNameIndex = indexes.some(
      (idx) => idx.name === "pageName_1" || (idx.key && idx.key.pageName)
    );

    if (!hasPageNameIndex) {
      console.log("✅ Aucun index pageName à supprimer.");
      process.exit(0);
      return;
    }

    await collection.dropIndex("pageName_1");
    console.log("✅ Index pageName_1 supprimé. Les doublons de pageName sont maintenant autorisés.");
  } catch (err) {
    if (err.code === 27 || err.message.includes("index not found")) {
      console.log("✅ L’index n’existe déjà plus.");
      process.exit(0);
      return;
    }
    console.error("❌ Erreur:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
  process.exit(0);
}

run();

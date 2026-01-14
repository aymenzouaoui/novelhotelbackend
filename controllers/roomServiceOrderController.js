const RoomServiceOrder = require("../models/RoomServiceOrder");
const nodemailer = require("nodemailer");

// 📧 Setup Nodemailer transporter (replace with your SMTP or Gmail credentials)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App password
  },
  logger: true,       // Logs SMTP communication
  debug: true,        // More verbose output
});

// Verify connection before sending email
transporter.verify((error, success) => {
  if (error) {
    console.error("🚨 SMTP verification failed:", error);
  } else {
    console.log("✅ SMTP connection is ready:", success);
  }
});


// 📧 Generate confirmation email HTML
function generateConfirmationEmail(order, confirmUrl) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
    <div style="text-align: center;">
      <img src="https://novoteltorontocentre.com/wp-content/themes/novotel/assets/img/novotel-monogram.png" alt="Novotel Logo" style="width: 150px;"/>
      <h2 style="color: #003366;">Confirmation de votre commande Room Service</h2>
    </div>
    <p>Bonjour <b>${order.name}</b>,</p>
    <p>Merci d'avoir choisi le service en chambre de <b>Novotel Tunis</b>. Veuillez confirmer votre commande en cliquant sur le bouton ci-dessous :</p>
    <div style="text-align: center; margin: 20px;">
      <a href="${confirmUrl}" style="background-color: #003366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Confirmer ma commande</a>
    </div>
    <p><b>Détails de la commande :</b></p>
    <ul>
      <li>Chambre : ${order.room}</li>
      <li>Service : ${order.service}</li>
      <li>Détails : ${order.serviceDetails}</li>
      <li>Heure : ${order.time || "Non spécifiée"}</li>
      <li>Status : ${order.status}</li>
    </ul>
    <hr/>
    <h3 style="color:#003366;">Contact</h3>
    <p>📞 +216 71 832 555<br/>
    📧 <a href="mailto:H6145@accor.com">H6145@accor.com</a><br/>
    🏨 Avenue Mohamed V, Tunis, Tunisie</p>
    <p><b>Réservations :</b><br/>
    📞 +216 71 832 555<br/>
    📧 <a href="mailto:H6145@accor.com">H6145@accor.com</a></p>
  </div>
  `;
}

// ✅ Create Order + Send confirmation email
exports.createRoomServiceOrder = async (req, res) => {
  console.log("📝 Incoming Room Service Order request:", req.body);

  try {
    const { name, email, room, service, serviceDetails, status, time } = req.body;

    console.log("📦 Creating RoomServiceOrder object...");
    const order = new RoomServiceOrder({
      name,
      email,
      room,
      service,
      serviceDetails,
      status,
      time,
      isValidated: false,
    });

    console.log("💾 Saving order to database...");
    await order.save();
    console.log("✅ Order saved successfully with ID:", order._id);

    // Generate confirmation URL
    const confirmUrl = `${req.protocol}://${req.get("host")}/api/roomservice-orders/confirm/${order._id}`;
    console.log("🔗 Generated confirmation URL:", confirmUrl);

console.log("✉️ Sending confirmation email...");
try {
  const info = await transporter.sendMail({
    from: `"Novotel Tunis" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Confirmation de votre commande Room Service - Novotel Tunis",
    html: generateConfirmationEmail(order, confirmUrl),
  });
  console.log("✅ Email sent:", info);
} catch (emailErr) {
  console.error("🚨 Email send failed:", emailErr);
}


    res.status(201).json({
      message: "Commande créée avec succès. Un email de confirmation a été envoyé.",
      order,
    });
  } catch (err) {
    console.error("❌ Error creating order:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Confirm Order
exports.confirmRoomServiceOrder = async (req, res) => {
  try {
    const order = await RoomServiceOrder.findByIdAndUpdate(
      req.params.id,
      { isValidated: true },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Commande non trouvée" });

    res.send(`
      <h2>✅ Votre commande a été confirmée avec succès !</h2>
      <p>Merci d'avoir choisi Novotel Tunis.</p>
    `);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get all validated orders
exports.getAllRoomServiceOrders = async (req, res) => {
  try {
    const orders = await RoomServiceOrder.find({ isValidated: true }); // ✅ only validated
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ Error fetching orders:", err.message);
    res.status(500).json({ message: err.message });
  }
};


// ✅ Get order by ID
exports.getRoomServiceOrderById = async (req, res) => {
  try {
    const order = await RoomServiceOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update order
exports.updateRoomServiceOrder = async (req, res) => {
  try {
    const { name, email, room, service, serviceDetails, status, time, isValidated } = req.body;

    const updatedFields = { name, email, room, service, serviceDetails, status, time, isValidated };

    const order = await RoomServiceOrder.findByIdAndUpdate(req.params.id, updatedFields, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json(order);
  } catch (err) {
    console.error("❌ Error updating order:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete order
exports.deleteRoomServiceOrder = async (req, res) => {
  try {
    const order = await RoomServiceOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

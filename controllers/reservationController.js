const Reservation = require("../models/Reservation");
const Notification = require("../models/notification")
const nodemailer = require("nodemailer");
const User = require("../models/User"); // import user model

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,   // log SMTP communication
  debug: true
});

async function sendReservationNotification(reservation) {
  try {
    // Create a case-insensitive regex for the service
    const serviceRegex = new RegExp(`^${reservation.service}$`, "i"); // matches exact, ignoring case

    // Find all users with role 'admin' or matching reservation service (case-insensitive)
    const users = await User.find({
      role: { $elemMatch: { $in: ["admin"] } } // admin always included
    }).or([
      { role: serviceRegex } // matches any role exactly like the service ignoring case
    ]);

    if (!users || users.length === 0) return;

    const emails = users.map(u => u.email);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emails,
      subject: "Nouvelle réservation",
      text: `Bonjour,\n\nUne nouvelle réservation a été effectuée par ${reservation.name} pour ${reservation.service} à ${new Date(reservation.to).toLocaleString()}.\nRoom: ${reservation.room}\n\nMerci.\nL'équipe Novotel.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erreur d'envoi d'email :", error);
      } else {
        console.log("Email envoyé aux responsables :", info.response);
      }
    });

  } catch (err) {
    console.error("Erreur lors de l'envoi des emails de notification :", err.message);
  }
}


// CREATE
exports.createReservation = async (req, res) => {
  try {
    const {
      name,
      email,
      from,
      to,
      people,
      mail,
      phoneNumber,
      service,
      serviceDetails,
      room,
      status 
    } = req.body;

    // Create reservation
    const reservation = new Reservation({
      name,
      email,
      from,
      to,
      people,
      mail,
      phoneNumber,
      service,
      serviceDetails,
      room,
      status 
    });

    await reservation.save();

    // Create notification
    const description = `Une nouvelle réservation a été effectuée par ${reservation.name} pour ${reservation.service} à ${new Date(reservation.to).toLocaleString()} room : ${reservation.room} .`;

    const notification = new Notification({
      description,
      service: reservation.service
    });

    await notification.save();

    // ✅ Send email to relevant users
    await sendReservationNotification(reservation);

    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// READ ALL
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find();
    res.status(200).json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// READ ONE
exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    res.status(200).json(reservation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
exports.updateReservation = async (req, res) => {
  try {
    const {
      name,
      email,
      from,
      to,
      people,
      mail,
      phoneNumber,
      service,
      serviceDetails,
      room,
      status
    } = req.body;

    const updated = await Reservation.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        from,
        to,
        people,
        mail,
        phoneNumber,
        service,
        serviceDetails,
        room,
        status 
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Reservation not found" });

    // ✅ Send email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: updated.email,
      subject: "Mise à jour de votre réservation",
      text: `Bonjour ${updated.name},\n\nVotre réservation est maintenant "${updated.status}" pour la date du ${new Date(updated.from).toLocaleDateString()}.\n\nMerci pour votre confiance.\nL'équipe Novotel. room ${updated.room} `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erreur d'envoi d'email :", error);
      } else {
        console.log("Email envoyé :", info.response);
      }
    });

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// DELETE
exports.deleteReservation = async (req, res) => {
  try {
    const deleted = await Reservation.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Reservation not found" });

    res.status(200).json({ message: "Reservation deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 

const SkipClean = require("../models/SkipClean");
const User = require("../models/User");
const Notification = require("../models/notification");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true,
});

async function sendSkipCleanNotification(skipClean) {
  try {
    // Find all admins and users with role 'skip_clean'
    const users = await User.find({
      $or: [
        { role: { $elemMatch: { $in: ["admin"] } } },
        { role: { $elemMatch: { $in: ["skip_clean"] } } },
      ],
    });

    if (!users || users.length === 0) return;

    const emails = users.map((u) => u.email);

    const description = `Nouvelle demande de Skip Clean pour ${skipClean.room || "une chambre"} soumise par ${skipClean.name || "un utilisateur"}.`;

    // Save notification for admins
    const notification = new Notification({
      description,
      service: "skip_clean",
    });
    await notification.save();

    // Send email to admins & skip_clean users
    const mailOptionsAdmins = {
      from: process.env.EMAIL_USER,
      to: emails,
      subject: "Nouvelle demande Skip Clean",
      text: `Bonjour,\n\nUne nouvelle demande de Skip Clean a été soumise.\n\nDétails :\n- Nom : ${skipClean.name || "N/A"}\n- Room : ${skipClean.room || "N/A"}\n- Date : ${skipClean.date ? new Date(skipClean.date).toLocaleString() : "N/A"}\n\nMerci.\nL'équipe.`,
    };

    transporter.sendMail(mailOptionsAdmins, (error, info) => {
      if (error) {
        console.error("Erreur d'envoi d'email aux responsables :", error);
      } else {
        console.log("Email envoyé aux responsables :", info.response);
      }
    });

    // Send confirmation email to the guest
    if (skipClean.email) {
      const mailOptionsGuest = {
        from: process.env.EMAIL_USER,
        to: skipClean.email,
        subject: "Confirmation de votre demande Skip Clean",
        text: `Bonjour ${skipClean.name || ""},\n\nVotre demande Skip Clean pour la chambre ${skipClean.room || ""} a bien été reçue pour la date du ${skipClean.date ? new Date(skipClean.date).toLocaleDateString() : "N/A"}.\n\nMerci pour votre confiance.\nL'équipe.`,
      };

      transporter.sendMail(mailOptionsGuest, (error, info) => {
        if (error) {
          console.error("Erreur d'envoi d'email au client :", error);
        } else {
          console.log("Email de confirmation envoyé au client :", info.response);
        }
      });
    }
  } catch (err) {
    console.error("Erreur lors de l'envoi des notifications SkipClean :", err.message);
  }
}

// ✅ Create new skip clean request
exports.createSkipClean = async (req, res) => {
  try {
    const skipClean = new SkipClean(req.body);
    const saved = await skipClean.save();

    // ✅ Send notifications & emails
    await sendSkipCleanNotification(saved);

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// ✅ Get all skip clean requests
exports.getAllSkipCleans = async (req, res) => {
  try {
    const skips = await SkipClean.find();
    res.json(skips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get skip clean request by ID
exports.getSkipCleanById = async (req, res) => {
  try {
    const skip = await SkipClean.findById(req.params.id);
    if (!skip) {
      return res.status(404).json({ error: "SkipClean request not found" });
    }
    res.json(skip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update skip clean request
exports.updateSkipClean = async (req, res) => {
  try {
    const updated = await SkipClean.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "SkipClean request not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Delete skip clean request
exports.deleteSkipClean = async (req, res) => {
  try {
    const deleted = await SkipClean.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "SkipClean request not found" });
    }
    res.json({ message: "SkipClean request deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

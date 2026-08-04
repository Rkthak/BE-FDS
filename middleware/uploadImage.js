const multer = require("multer");
const path = require("path");
const fs = require("fs");

// create upload directories
const createUploadsDir = () => {
  const uploadDirs = [
    "uploads",
    "uploads/users",
    "uploads/logos",
    "uploads/banners",
    "uploads/menus",
  ];

  uploadDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadsDir();

// multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/";

    if (file.fieldname === "profileImage") {
      uploadPath += "users/";
    } else if (file.fieldname === "restaurantBanner") {
      uploadPath += "banners/";
    } else if (file.fieldname === "restaurantLogo") {
      uploadPath += "logos/";
    } else if (file.fieldname === "menuImage") {
      uploadPath += "menus/";
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

// file validation
const fileFilter = (req, file, cb) => {
  const allowedFields = [
    "profileImage",
    "restaurantBanner",
    "restaurantLogo",
    "menuImage",
  ];

  if (!allowedFields.includes(file.fieldname)) {
    return cb(new Error("Invalid image field name."), false);
  }

  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = upload;

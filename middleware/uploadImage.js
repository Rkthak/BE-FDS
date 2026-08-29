const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder;

    if (file.fieldname === "profileImage") {
      folder = "foodrush/users";
    } else if (file.fieldname === "restaurantBanner") {
      folder = "foodrush/banners";
    } else if (file.fieldname === "restaurantLogo") {
      folder = "foodrush/logos";
    } else if (file.fieldname === "menuImage") {
      folder = "foodrush/menus";
    } else {
      throw new Error("Invalid image field name.");
    }

    return {
      folder,
    };
  },
});

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
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;

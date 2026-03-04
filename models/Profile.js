const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  phone: {
    type: String,
    required: true,
    index: true, // Add index for faster phone-based queries
  },
  name: {
    type: String,
    required: true,
  },
  backgroundPreference: {
    type: String, // Can be a color code or theme name
    default: "#f5f5f5",
  },
  photo: {
    type: String, // URL or path to profile photo
    default: null,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Static method to find profiles by phone number
profileSchema.statics.findProfilesByPhone = function(phone) {
  return this.find({ phone: phone }).sort({ createdAt: -1 });
};

// Static method to find default profile by phone number
profileSchema.statics.findDefaultProfileByPhone = function(phone) {
  return this.findOne({ phone: phone, isDefault: true });
};

// Static method to set default profile
profileSchema.statics.setDefaultProfile = function(profileId) {
  return this.updateMany(
    { _id: profileId },
    { $set: { isDefault: true } }
  ).then(() => {
    return this.updateMany(
      { _id: { $ne: profileId } },
      { $set: { isDefault: false } }
    );
  });
};

module.exports = mongoose.model("Profile", profileSchema);

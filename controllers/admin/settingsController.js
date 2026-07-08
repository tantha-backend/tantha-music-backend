const Setting = require("../../models/Setting");

const SETTINGS_KEY = "platform_settings";

const getOrCreateSettings = async () => {
  let settings = await Setting.findOne({ key: SETTINGS_KEY });

  if (!settings) {
    settings = await Setting.create({
      key: SETTINGS_KEY,
    });
  }

  return settings;
};

const getSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
    });
  }
};

const updateSettingsSection = async (section, payload, res) => {
  try {
    const settings = await getOrCreateSettings();

    settings[section] = {
      ...settings[section]?.toObject?.(),
      ...payload,
    };

    await settings.save();

    return res.status(200).json({
      success: true,
      message: `${section} settings updated successfully`,
      settings,
    });
  } catch (error) {
    console.error(`Update ${section} settings error:`, error);

    return res.status(500).json({
      success: false,
      message: `Failed to update ${section} settings`,
    });
  }
};

const updateGeneralSettings = async (req, res) => {
  return updateSettingsSection("general", req.body, res);
};

const updateStorageSettings = async (req, res) => {
  return updateSettingsSection("storage", req.body, res);
};

const updateFeatureSettings = async (req, res) => {
  return updateSettingsSection("features", req.body, res);
};

const updateSecuritySettings = async (req, res) => {
  return updateSettingsSection("security", req.body, res);
};

const updateNotificationSettings = async (req, res) => {
  return updateSettingsSection("notifications", req.body, res);
};

const updateEmailSettings = async (req, res) => {
  return updateSettingsSection("email", req.body, res);
};

const updateStreamingSettings = async (req, res) => {
  return updateSettingsSection("streaming", req.body, res);
};

const updateUploadSettings = async (req, res) => {
  return updateSettingsSection("uploads", req.body, res);
};

const updateMaintenanceMode = async (req, res) => {
  return updateSettingsSection("maintenance", req.body, res);
};

const resetSettings = async (req, res) => {
  try {
    await Setting.findOneAndDelete({ key: SETTINGS_KEY });

    const settings = await Setting.create({
      key: SETTINGS_KEY,
    });

    return res.status(200).json({
      success: true,
      message: "Settings reset successfully",
      settings,
    });
  } catch (error) {
    console.error("Reset settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset settings",
    });
  }
};

module.exports = {
  getSettings,
  updateGeneralSettings,
  updateStorageSettings,
  updateFeatureSettings,
  updateSecuritySettings,
  updateNotificationSettings,
  updateEmailSettings,
  updateStreamingSettings,
  updateUploadSettings,
  updateMaintenanceMode,
  resetSettings,
};

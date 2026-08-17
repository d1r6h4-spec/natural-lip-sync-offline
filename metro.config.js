const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const nativeWindCache = path.resolve(__dirname, "node_modules/react-native-css-interop/.cache");
config.watchFolders = [...(config.watchFolders ?? []), nativeWindCache];
config.resolver.assetExts = [...config.resolver.assetExts, "onnx"];

module.exports = withNativeWind(config, {
  input: "./global.css",
});

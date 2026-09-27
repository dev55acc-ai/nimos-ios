// Reanimated 4 runs on the New Architecture with the worklets babel plugin.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "react" }]],
    plugins: ["react-native-worklets/plugin"],
  };
};

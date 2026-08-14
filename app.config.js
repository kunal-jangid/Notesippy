const packageJson = require('./package.json');

module.exports = {
  expo: {
    name: "notesippy",
    slug: "notesippy",
    version: packageJson.version,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "notesippy",
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/expo.icon"
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      predictiveBackGestureEnabled: false,
      package: process.env.ANDROID_PACKAGE_NAME || "com.kunaljangid2k3.notesippy"
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "./notifee-plugin.js",
      [
        "react-native-android-widget",
        {
          widgets: [
            {
              name: "NotesGridWidget",
              label: "Notes Grid Widget",
              minWidth: "160dp",
              minHeight: "100dp",
              targetCellWidth: 4,
              targetCellHeight: 3,
              maxResizeWidth: "500dp",
              maxResizeHeight: "500dp",
              resizeMode: "horizontal|vertical",
              description: "Resizable minimal note widget."
            }
          ]
        }
      ],
      [
        "expo-splash-screen",
        {
          backgroundColor: "#208AEF",
          image: "./assets/images/splash-icon.png",
          imageWidth: 76
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    }
  }
};

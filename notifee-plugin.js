const { withProjectBuildGradle, withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withNotifee(config) {
  // 1. Add Gradle local Maven path for Notifee
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const mavenRepo = `
        maven {
          url "$rootDir/../node_modules/@notifee/react-native/android/libs"
        }
      `;
      if (!config.modResults.contents.includes('@notifee/react-native/android/libs')) {
        config.modResults.contents = config.modResults.contents.replace(
          /allprojects\s*\{\s*repositories\s*\{/,
          `allprojects {\n    repositories {\n${mavenRepo}`
        );
      }
    }
    return config;
  });

  // 2. Add Foreground Service permissions for Android 14+ / Samsung One UI
  config = withAndroidManifest(config, (config) => {
    const mainManifest = config.modResults.manifest;

    if (!mainManifest['uses-permission']) {
      mainManifest['uses-permission'] = [];
    }

    const permissions = [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
      'android.permission.POST_NOTIFICATIONS',
    ];

    permissions.forEach((perm) => {
      if (!mainManifest['uses-permission'].some((p) => p.$['android:name'] === perm)) {
        mainManifest['uses-permission'].push({
          $: { 'android:name': perm },
        });
      }
    });

    return config;
  });

  return config;
};
export default {
  expo: {
    name: "Connect",
    slug: "connect",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.connect.app",
      infoPlist: {
        UIBackgroundModes: ["remote-notification"]
      },
      entitlements: {
        "aps-environment": "development",
        "com.apple.security.application-groups": [
          "group.com.connect.app.onesignal"
        ]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.connect.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-image-picker",
      "expo-location",
      [
        "onesignal-expo-plugin",
        {
          mode: "development"
        }
      ]
    ],
    newArchEnabled: true,
    entryPoint: "./index.js",
    extra: {
      oneSignalAppId: process.env.ONE_SIGNAL_APP_ID || "bd411f7d-9897-401c-9e0e-8f979b77fa93"
    }
  }
};
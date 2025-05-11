Bundle JavaScript

3s


env: load .env
env: export CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET supabaseUrl supabaseKey
Starting Metro Bundler
Android Bundling failed 189ms index.js (1 module)
SyntaxError: index.js: Cannot find module 'react-native-reanimated/plugin'
Require stack:
- /home/expo/workingdir/build/node_modules/@babel/core/lib/config/files/plugins.js
- /home/expo/workingdir/build/node_modules/@babel/core/lib/config/files/index.js
- /home/expo/workingdir/build/node_modules/@babel/core/lib/index.js
- /home/expo/workingdir/build/node_modules/@expo/metro-config/build/transform-worker/metro-transform-worker.js
- /home/expo/workingdir/build/node_modules/@expo/metro-config/build/transform-worker/transform-worker.js
- /home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/Worker.flow.js
- /home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/Worker.js
- /home/expo/workingdir/build/node_modules/jest-worker/build/workers/processChild.js
Make sure that all the Babel plugins and presets you are using
are defined as dependencies or devDependencies in your package.json
file. It's possible that the missing plugin is loaded by a preset
you are using that forgot to add the plugin to its dependencies: you
can workaround this problem by explicitly adding the missing package
to your top-level package.json.
Error: Cannot find module 'react-native-reanimated/plugin'
Require stack:
- /home/expo/workingdir/build/node_modules/@babel/core/lib/config/files/plugins.js
- /home/expo/workingdir/build/node_modules/@babel/core/lib/config/files/index.js
- /home/expo/workingdir/build/node_modules/@babel/core/lib/index.js
- /home/expo/workingdir/build/node_modules/@expo/metro-config/build/transform-worker/metro-transform-worker.js
- /home/expo/workingdir/build/node_modules/@expo/metro-config/build/transform-worker/transform-worker.js
- /home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/Worker.flow.js
- /home/expo/workingdir/build/node_modules/metro/src/DeltaBundler/Worker.js
- /home/expo/workingdir/build/node_modules/jest-worker/build/workers/processChild.js
Make sure that all the Babel plugins and presets you are using
are defined as dependencies or devDependencies in your package.json
file. It's possible that the missing plugin is loaded by a preset
you are using that forgot to add the plugin to its dependencies: you
can workaround this problem by explicitly adding the missing package
to your top-level package.json.
    at Module._resolveFilename (node:internal/modules/cjs/loader:1225:15)
    at resolve (node:internal/modules/helpers:190:19)
    at tryRequireResolve (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/files/plugins.js:128:11)
    at resolveStandardizedNameForRequire (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/files/plugins.js:162:19)
    at resolveStandardizedName (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/files/plugins.js:183:12)
    at loadPlugin (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/files/plugins.js:56:7)
    at loadPlugin.next (<anonymous>)
    at createDescriptor (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/config-descriptors.js:140:16)
    at createDescriptor.next (<anonymous>)
    at evaluateSync (/home/expo/workingdir/build/node_modules/gensync/index.js:251:28)
    at /home/expo/workingdir/build/node_modules/gensync/index.js:31:34
    at Array.map (<anonymous>)
    at Function.sync (/home/expo/workingdir/build/node_modules/gensync/index.js:31:22)
    at Function.all (/home/expo/workingdir/build/node_modules/gensync/index.js:210:24)
    at Generator.next (<anonymous>)
    at createDescriptors (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/config-descriptors.js:102:41)
    at createDescriptors.next (<anonymous>)
    at createPluginDescriptors (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/config-descriptors.js:99:17)
    at createPluginDescriptors.next (<anonymous>)
    at /home/expo/workingdir/build/node_modules/@babel/core/lib/gensync-utils/functional.js:22:27
    at Generator.next (<anonymous>)
    at mergeChainOpts (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/config-chain.js:349:34)
    at mergeChainOpts.next (<anonymous>)
    at chainWalker (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/config-chain.js:316:14)
    at chainWalker.next (<anonymous>)
    at loadFileChain (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/config-chain.js:191:24)
    at loadFileChain.next (<anonymous>)
    at mergeExtendsChain (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/config-chain.js:328:28)
    at mergeExtendsChain.next (<anonymous>)
    at chainWalker (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/config-chain.js:312:20)
    at chainWalker.next (<anonymous>)
    at buildRootChain (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/config-chain.js:56:36)
    at buildRootChain.next (<anonymous>)
    at loadPrivatePartialConfig (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/partial.js:72:62)
    at loadPrivatePartialConfig.next (<anonymous>)
    at loadFullConfig (/home/expo/workingdir/build/node_modules/@babel/core/lib/config/full.js:36:46)
    at loadFullConfig.next (<anonymous>)
    at transform (/home/expo/workingdir/build/node_modules/@babel/core/lib/transform.js:20:44)
    at transform.next (<anonymous>)
    at evaluateSync (/home/expo/workingdir/build/node_modules/gensync/index.js:251:28)
    at sync (/home/expo/workingdir/build/node_modules/gensync/index.js:89:14)
    at stopHiding - secret - don't use this - v1 (/home/expo/workingdir/build/node_modules/@babel/core/lib/errors/rewrite-stack-trace.js:47:12)
    at Object.transformSync (/home/expo/workingdir/build/node_modules/@babel/core/lib/transform.js:42:76)
    at parseWithBabel (/home/expo/workingdir/build/node_modules/@expo/metro-config/build/transformSync.js:65:18)
    at transformSync (/home/expo/workingdir/build/node_modules/@expo/metro-config/build/transformSync.js:54:12)
    at Object.transform (/home/expo/workingdir/build/node_modules/@expo/metro-config/build/babel-transformer.js:115:58)
    at transformJSWithBabel (/home/expo/workingdir/build/node_modules/@expo/metro-config/build/transform-worker/metro-transform-worker.js:440:47)
    at Object.transform (/home/expo/workingdir/build/node_modules/@expo/metro-config/build/transform-worker/metro-transform-worker.js:549:12)
    at Object.transform (/home/expo/workingdir/build/node_modules/@expo/metro-config/build/transform-worker/transform-worker.js:117:23)
npx expo export:embed --eager --platform android --dev false exited with non-zero code: 1

Fail job

1s


Build failed

npx expo export:embed --eager --platform android --dev false exited with non-zero code: 1
also expo doctor showing error Run expo doctor


1
4s


Running "expo doctor"
env: load .env
env: export CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET supabaseUrl supabaseKey
Running 15 checks on your project...
9/15 checks passed. 6 checks failed. Possible issues detected:
Use the --verbose flag to see more details about passed checks.
✖ Check Expo config (app.json/ app.config.js) schema
Error validating fields in /home/expo/workingdir/build/app.json:
 should NOT have additional property 'entryPoint'.
Advice:
Resolve schema errors in your app config. Learn more: https://docs.expo.dev/workflow/configuration/
✖ Check Expo config for common issues
You have an app.json file in your project, but your app.config.js is not using the values from it.
Advice:
Remove the static app.json, or use its values in your dynamic app.config.js. Learn more: https://docs.expo.dev/workflow/configuration
✖ Check that native modules use compatible support package versions for installed Expo SDK
Expected package metro@^0.81.0
Found invalid:
  metro@0.82.3
  (for more info, run: npm why metro)
Expected package metro-resolver@^0.81.0
Found invalid:
  metro-resolver@0.82.3
  (for more info, run: npm why metro-resolver)
Expected package metro-config@^0.81.0
Found invalid:
  metro-config@0.82.3
  (for more info, run: npm why metro-config)
Advice:
Upgrade dependencies that are using the invalid package versions.
✖ Check for app config fields that may not be synced in a non-CNG project
This project contains native project folders but also has native configuration properties in app.config.js, indicating it is configured to use Prebuild. When the android/ios folders are present, EAS Build will not sync the following properties: orientation, icon, userInterfaceStyle, splash, ios, android, plugins. 
Advice:
Add '/android' and '/ios' to your .gitignore file if you intend to use CNG / Prebuild. Learn more: https://docs.expo.dev/workflow/prebuild/#usage-with-eas-build
✖ Validate packages against React Native Directory package metadata
The following issues were found when validating your dependencies against React Native Directory:
  Untested on New Architecture: react-native-webrtc
  Unmaintained: @rneui/themed
  No metadata available: @react-native/metro-config, base-64, base64-arraybuffer, nanoid, onesignal-expo-plugin, peerjs, react-native-peerjs, uuid
Advice:
Use libraries that are actively maintained and support the New Architecture. Find alternative libraries with https://reactnative.directory.
Add packages to expo.doctor.reactNativeDirectoryCheck.exclude in package.json to selectively skip validations, if the warning is not relevant.
Update React Native Directory to include metadata for unknown packages. Alternatively, set expo.doctor.reactNativeDirectoryCheck.listUnknownPackages in package.json to false to skip warnings about packages with no metadata, if the warning is not relevant.
✖ Check that packages match versions required by installed Expo SDK
The following packages should be updated for best compatibility with the installed expo version:
  expo@52.0.44 - expected version: ~52.0.46
  react-native-webview@13.13.5 - expected version: 13.12.5
Your project may not work correctly until you install the expected versions of the packages.
Found outdated dependencies
Advice:
Use 'npx expo install --check' to review and upgrade your dependencies.
6 checks failed, indicating possible issues with the project.
Command "expo doctor" failed.
npx -y expo-doctor exited with non-zero code: 1
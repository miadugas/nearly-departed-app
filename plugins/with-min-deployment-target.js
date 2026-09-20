// Xcode 27 refuses deployment targets below iOS 15, but a few CocoaPods
// resource-bundle targets (RNSVG-RNSVGFilters at 12.4, RNCAsyncStorage
// resources at 13.4) still pin their own. `react_native_post_install` doesn't
// touch them, so every archive fails until they're raised. `ios/` is prebuild
// output and not tracked, so the fix has to live here, not in the Podfile.
const { withPodfile } = require("expo/config-plugins");

const MARKER = "# @nearly-departed min-deployment-target";
const FLOOR = "16.4";

const RUBY = `
    ${MARKER}
    installer.pods_project.targets.each do |t|
      t.build_configurations.each do |c|
        current = c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f
        c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${FLOOR}' if current < 15.0
      end
    end
`;

// Anchor on the close of the react_native_post_install(...) call so our loop
// runs after React Native's own post-install adjustments.
const ANCHOR = /react_native_post_install\([\s\S]*?\n {4}\)\n/;

module.exports = function withMinDeploymentTarget(config) {
  return withPodfile(config, (mod) => {
    const contents = mod.modResults.contents;
    if (contents.includes(MARKER)) return mod;
    if (!ANCHOR.test(contents)) {
      throw new Error(
        "with-min-deployment-target: react_native_post_install(...) not found in Podfile",
      );
    }
    mod.modResults.contents = contents.replace(ANCHOR, (m) => m + RUBY);
    return mod;
  });
};

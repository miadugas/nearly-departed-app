// Single source of truth: the legal copy lives in /legal/*.md.
// babel-plugin-inline-import inlines them as strings at build time, so editing
// the .md files is all you need — no hand-syncing. The .md files double as the
// hosted versions used for the App Store Privacy Policy URL.

import PRIVACY_POLICY from "../../legal/privacy-policy.md";
import TERMS_OF_SERVICE from "../../legal/terms-of-service.md";

export { PRIVACY_POLICY, TERMS_OF_SERVICE };

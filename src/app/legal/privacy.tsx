import { LegalScreen } from "@/components/legal-screen";
import { PRIVACY_POLICY } from "@/content/legal";

export default function PrivacyScreen() {
  return <LegalScreen source={PRIVACY_POLICY} />;
}

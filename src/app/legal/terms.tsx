import { LegalScreen } from "@/components/legal-screen";
import { TERMS_OF_SERVICE } from "@/content/legal";

export default function TermsScreen() {
  return <LegalScreen title="Terms of Service" source={TERMS_OF_SERVICE} />;
}

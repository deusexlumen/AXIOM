export function contactPageTemplate(): string {
  return `import { ContactForm } from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <main>
      <ContactForm />
    </main>
  );
}
`;
}

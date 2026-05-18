import ContactClient from "./ContactClient";

export const metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the Nautilus WMS team. Sales inquiries, technical support, and partnership opportunities.",
  alternates: { canonical: "https://Nautiluswms.com/contact" },
};

export default function ContactPage() {
  return <ContactClient />;
}

import About from "@/components/site/About";
import Contact, { FinalCta } from "@/components/site/Contact";
import Faq from "@/components/site/Faq";
import Guide from "@/components/site/Guide";
import Habits from "@/components/site/Habits";
import Hero from "@/components/site/Hero";
import Marquee from "@/components/site/Marquee";
import Process from "@/components/site/Process";
import Specialties from "@/components/site/Specialties";
import Splash from "@/components/site/Splash";
import { getPhotos } from "@/lib/photo";
import { faq, site } from "@/lib/site";

// Dados estruturados (schema.org) para o Google entender que é um consultório.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Dentist", "LocalBusiness"],
      "@id": `${site.url}/#clinica`,
      name: site.name,
      description:
        "Cirurgiã-dentista em Sorocaba, especialista em Endodontia e Prótese Dentária. Implantes, clareamento, alinhadores e clínica geral.",
      url: site.url,
      telephone: `+${site.whatsapp}`,
      image: `${site.url}/opengraph-image`,
      medicalSpecialty: ["Endodontics", "Prosthodontics", "Dentistry"],
      address: {
        "@type": "PostalAddress",
        addressLocality: site.city,
        addressRegion: site.state,
        addressCountry: "BR",
        ...(site.address ? { streetAddress: site.address } : {}),
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "08:00",
          closes: "12:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "13:30",
          closes: "17:30",
        },
      ],
      sameAs: [site.instagramUrl],
      employee: {
        "@type": "Person",
        name: site.name,
        jobTitle: "Cirurgiã-Dentista",
        identifier: site.cro,
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function Home() {
  const photos = getPhotos();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Splash />
      <Hero photos={photos} />
      <Marquee />
      <About photos={photos} />
      <Specialties />
      <Guide />
      <Process />
      <Habits />
      <Faq />
      <Contact />
      <FinalCta />
    </>
  );
}

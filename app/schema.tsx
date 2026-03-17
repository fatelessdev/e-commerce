export default function Schema() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://xilar.in/#organization",
        "name": "XILAR",
        "url": "https://xilar.in",
        "logo": "https://xilar.in/logo.png",
        "sameAs": [
          "https://www.instagram.com/xilar.in/" // <-- Brand social linked here
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://xilar.in/#website",
        "name": "XILAR",
        "url": "https://xilar.in",
        "publisher": { "@id": "https://xilar.in/#organization" },
        "creator": {
          "@type": "Person",
          "name": "Aditya Singh",
          "alternateName": ["fatelessdev", "fate1ess"],
          "url": "https://fateless.dev",
          "sameAs": [
            "https://github.com/fatelessdev",
            "https://x.com/fate1ess"
          ]
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
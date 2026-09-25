// frontend/src/components/SEO.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({
  title = 'JemberTrip - Panduan Wisata Cerdas Kabupaten Jember',
  description = 'Platform eksplorasi destinasi wisata, kuliner, dan budaya Jember dengan chatbot AI Cak Jember dan rekomendasi personalisasi.',
  keywords = 'wisata jember, pantai papuma, chatbot wisata, rekomendasi jember, kuliner jember, wisata jatim',
  image = 'https://jembertrip.vercel.app/banner-jembertrip.jpg',
  url = 'https://jembertrip.id',
  type = 'website',
  author = 'JemberTrip Team',
  schema = null,
  noindex = false,
}) {
  const siteName = 'JemberTrip';
  const fullTitle = title.includes('JemberTrip') ? title : `${title} - ${siteName}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={url} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph (Facebook, WhatsApp, LinkedIn) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="id_ID" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}

import React from "react";
import { Helmet } from "react-helmet-async";

type SEOProps = {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  canonical?: string; // لو عايز تمرّرها صراحةً
};

export default function SEO({
  title,
  description,
  url,
  image,
  canonical,
}: SEOProps) {
  const cano = canonical || url;

  return (
    <Helmet>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}

      {/* Canonical */}
      {cano && <link rel="canonical" href={cano} />}

      {/* Open Graph */}
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      {url && <meta property="og:url" content={url} />}
      <meta property="og:type" content="article" />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {title && <meta name="twitter:title" content={title} />}
      {description && (
        <meta name="twitter:description" content={description} />
      )}
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}

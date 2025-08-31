import { useEffect } from 'react';

interface SEOData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export function useSEO(data: SEOData) {
  useEffect(() => {
    if (!data.title && !data.description) return;

    // Update document title
    if (data.title) {
      document.title = data.title;
    }

    // Update meta description
    if (data.description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', data.description);
      } else {
        const newMetaDesc = document.createElement('meta');
        newMetaDesc.name = 'description';
        newMetaDesc.content = data.description;
        document.head.appendChild(newMetaDesc);
      }
    }

    // Update Open Graph tags
    const updateOGTag = (property: string, content: string) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (ogTag) {
        ogTag.setAttribute('content', content);
      } else {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        ogTag.setAttribute('content', content);
        document.head.appendChild(ogTag);
      }
    };

    if (data.title) updateOGTag('og:title', data.title);
    if (data.description) updateOGTag('og:description', data.description);
    if (data.image) updateOGTag('og:image', data.image);
    if (data.url) updateOGTag('og:url', data.url);

    // Update canonical tag with correct domain
    if (data.url) {
      let canonicalTag = document.querySelector('link[rel="canonical"]');
      if (canonicalTag) {
        canonicalTag.setAttribute('href', data.url);
      } else {
        canonicalTag = document.createElement('link');
        canonicalTag.setAttribute('rel', 'canonical');
        canonicalTag.setAttribute('href', data.url);
        document.head.appendChild(canonicalTag);
      }
    }

    // Cleanup function to restore original title
    return () => {
      document.title = 'BuddyTour - Authentic Alexandria Walking Tours';
    };
  }, [data.title, data.description, data.image, data.url]);
}
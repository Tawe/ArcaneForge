import { useEffect } from 'react';

interface MetaTags {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const useMetaTags = ({ title, description, image, url, type = 'website' }: MetaTags) => {
  useEffect(() => {
    // Update or create meta tags
    const setMetaTag = (property: string, content: string, isProperty = true) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Update title
    document.title = title || 'Arcane Forge';

    // Open Graph tags
    setMetaTag('og:title', title || 'Arcane Forge - D&D Magic Item Generator');
    setMetaTag('og:description', description || 'Generate unique D&D magic items with AI. Create custom weapons, armor, potions, and more with rich lore and stunning visuals.');
    setMetaTag('og:image', image || `${window.location.origin}/favicon.svg`);
    setMetaTag('og:url', url || window.location.origin);
    setMetaTag('og:type', type);

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image', false);
    setMetaTag('twitter:title', title || 'Arcane Forge - D&D Magic Item Generator', false);
    setMetaTag('twitter:description', description || 'Generate unique D&D magic items with AI. Create custom weapons, armor, potions, and more with rich lore and stunning visuals.', false);
    setMetaTag('twitter:image', image || `${window.location.origin}/favicon.svg`, false);

    // Cleanup function to reset to defaults
    return () => {
      document.title = 'Arcane Forge';
      setMetaTag('og:title', 'Arcane Forge - D&D Magic Item Generator');
      setMetaTag('og:description', 'Generate unique D&D magic items with AI. Create custom weapons, armor, potions, and more with rich lore and stunning visuals.');
      setMetaTag('og:image', `${window.location.origin}/favicon.svg`);
      setMetaTag('og:url', window.location.origin);
      setMetaTag('og:type', 'website');
      setMetaTag('twitter:title', 'Arcane Forge - D&D Magic Item Generator', false);
      setMetaTag('twitter:description', 'Generate unique D&D magic items with AI. Create custom weapons, armor, potions, and more with rich lore and stunning visuals.', false);
      setMetaTag('twitter:image', `${window.location.origin}/favicon.svg`, false);
    };
  }, [title, description, image, url, type]);
};


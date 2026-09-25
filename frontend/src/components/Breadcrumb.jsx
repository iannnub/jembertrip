// frontend/src/components/Breadcrumb.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Breadcrumb({ items = [] }) {
  const allItems = [
    { label: 'Beranda', href: '/' },
    ...items
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": allItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      ...(item.href ? { "item": `https://jembertrip.id${item.href}` } : {})
    }))
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>

      <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 md:space-x-2 text-xs md:text-sm text-text-muted mb-4 overflow-x-auto py-1">
        <Link 
          to="/" 
          className="flex items-center gap-1 hover:text-primary transition-colors shrink-0 p-1 rounded-md"
          title="Beranda JemberTrip"
        >
          <Home size={15} className="text-primary/70" />
          <span className="hidden sm:inline">Beranda</span>
        </Link>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <div key={index} className="flex items-center space-x-1.5 md:space-x-2 shrink-0">
              <ChevronRight size={14} className="text-gray-400 shrink-0" />
              {item.href && !isLast ? (
                <Link 
                  to={item.href} 
                  className="hover:text-primary transition-colors text-text-muted hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-text-main font-semibold line-clamp-1 max-w-[200px] md:max-w-md">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}

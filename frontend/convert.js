const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '3.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Extract content from body
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (!bodyMatch) {
  console.error("Could not find body tag");
  process.exit(1);
}
let bodyContent = bodyMatch[1];

// 2. Remove HTML comments from the bodyContent
bodyContent = bodyContent.replace(/<!--[\s\S]*?-->/g, '');

// 3. Remove script tags from the bodyContent
bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, '');

// 4. Remove style tags
bodyContent = bodyContent.replace(/<style[\s\S]*?<\/style>/gi, '');

// 5. Replace &quot; with ' to avoid semicolon splitting issues
bodyContent = bodyContent.replace(/&quot;/g, "'");

// 6. Replace class with className
bodyContent = bodyContent.replace(/(\s)class=/g, '$1className=');

// 7. Replace for with htmlFor
bodyContent = bodyContent.replace(/(\s)for=/g, '$1htmlFor=');

// 8. Close unclosed tags: img, br, hr, input
bodyContent = bodyContent.replace(/<img([^>]*?)(?:\/?)>/g, (match, p1) => {
  if (p1.trim().endsWith('/')) return match;
  return `<img${p1} />`;
});

bodyContent = bodyContent.replace(/<br([^>]*?)(?:\/?)>/g, (match, p1) => {
  if (p1.trim().endsWith('/')) return match;
  return `<br${p1} />`;
});

bodyContent = bodyContent.replace(/<hr([^>]*?)(?:\/?)>/g, (match, p1) => {
  if (p1.trim().endsWith('/')) return match;
  return `<hr${p1} />`;
});

bodyContent = bodyContent.replace(/<input([^>]*?)(?:\/?)>/g, (match, p1) => {
  if (p1.trim().endsWith('/')) return match;
  return `<input${p1} />`;
});

// 9. Convert inline styles to JSX style objects
bodyContent = bodyContent.replace(/style="([^"]*?)"/g, (match, styleStr) => {
  if (!styleStr.trim()) return '';
  const rules = styleStr.split(';').filter(r => r.trim());
  const objRules = rules.map(rule => {
    const parts = rule.split(':');
    const property = parts[0].trim();
    const value = parts.slice(1).join(':').trim();
    
    // Camelcase conversion (handles leading dashes like -webkit- or -moz- properly)
    const camelProp = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    
    return `"${camelProp}": "${value.replace(/"/g, '\\"')}"`;
  });
  return `style={{ ${objRules.join(', ')} }}`;
});

// 10. Convert SVG attributes to camelCase
const attrMap = {
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'fill-opacity': 'fillOpacity',
  'stop-color': 'stopColor',
  'stddeviation': 'stdDeviation',
  'attributename': 'attributeName',
  'repeatcount': 'repeatCount',
  'calcmode': 'calcMode',
  'keysplines': 'keySplines',
  'viewbox': 'viewBox',
  'autoplay': 'autoPlay',
  'playsinline': 'playsInline',
  'crossorigin': 'crossOrigin'
};

for (const [kebab, camel] of Object.entries(attrMap)) {
  const regex = new RegExp(`(\\s)${kebab}=`, 'g');
  bodyContent = bodyContent.replace(regex, `$1${camel}=`);
}

// 11. Replace forex.png with /forex.png
bodyContent = bodyContent.replace(/href="forex.png"/g, 'href="/forex.png"');
bodyContent = bodyContent.replace(/src="forex.png"/g, 'src="/forex.png"');
bodyContent = bodyContent.replace(/url\('forex.png'\)/g, "url('/forex.png')");
bodyContent = bodyContent.replace(/url\("forex.png"\)/g, "url('/forex.png')");

// 12. Replace static link targets with routing paths
bodyContent = bodyContent.replace(/href="login.html"/g, 'href="/login"');
bodyContent = bodyContent.replace(/href="3.html"/g, 'href="/"');

// 13. Create the final JSX file
const pageJsTemplate = `"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Theme toggle logic
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      const label = toggle.querySelector('.theme-label');

      const setTheme = (mode) => {
        const isLight = mode === 'light';
        document.body.classList.toggle('light-theme', isLight);
        toggle.setAttribute('aria-pressed', String(isLight));
        toggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
        if (label) label.textContent = isLight ? 'Dark' : 'Light';
        localStorage.setItem('forex-auto-panel-theme', isLight ? 'light' : 'dark');

        // Dynamically update inline style for quote words to ensure high contrast in both themes
        document.querySelectorAll('.quote-word').forEach((word) => {
          word.style.color = isLight ? 'var(--text-primary)' : 'rgb(255 255 255)';
        });
      };

      setTheme(localStorage.getItem('forex-auto-panel-theme') || 'dark');

      const handleToggle = () => {
        setTheme(document.body.classList.contains('light-theme') ? 'dark' : 'light');
      };

      toggle.addEventListener('click', handleToggle);
      
      return () => {
        toggle.removeEventListener('click', handleToggle);
      };
    }
  }, []);

  useEffect(() => {
    // Scroll Animation Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
${bodyContent}
    </>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'app', 'page.js'), pageJsTemplate, 'utf8');
console.log("Successfully converted 3.html to app/page.js");

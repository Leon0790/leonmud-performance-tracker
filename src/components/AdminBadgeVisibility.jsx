import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Hides the Base44 platform "Edit with Base44" badge for non-admin users
 * by injecting a CSS rule that targets the badge iframe/element.
 */
export default function AdminBadgeVisibility() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    const styleId = 'admin-badge-style';
    let existing = document.getElementById(styleId);

    if (!existing) {
      existing = document.createElement('style');
      existing.id = styleId;
      document.head.appendChild(existing);
    }

    if (user && user.role !== 'admin') {
      // Hide the Base44 platform badge for non-admin users
      existing.textContent = `
        [data-base44-badge],
        iframe[src*="base44"],
        a[href*="base44.com"][target="_blank"]:not([href*="docs"]) {
          display: none !important;
        }
      `;
    } else {
      existing.textContent = '';
    }
  }, [user?.role]);

  return null;
}
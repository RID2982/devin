import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

function humanize(segment: string) {
  if (/^[0-9a-f-]{20,}$/i.test(segment)) return 'Detail';
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/" className="hover:text-foreground">
        Home
      </Link>
      {segments.map((seg, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/');
        const isLast = i === segments.length - 1;
        return (
          <span key={path} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="font-medium text-foreground">{humanize(seg)}</span>
            ) : (
              <Link to={path} className="hover:text-foreground">
                {humanize(seg)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useSectionLink() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback((sectionId: string) => {
    if (location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    navigate('/');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }, [location.pathname, navigate]);
}

export default useSectionLink;

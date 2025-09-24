import React, { useEffect, useRef, useState } from "react";
import UserMaps from "../../components/Maps/UserMaps";
import PageMeta from "../../components/common/PageMeta";
import { useTranslation } from 'react-i18next';

const UserMapPage: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [heightPx, setHeightPx] = useState<number | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const computeHeight = () => {
      // Compute available height using the header's actual height so the map
      // sits directly below the sticky header without overlapping.
      // Use document.documentElement.clientHeight for a precise viewport height
      // (avoids including scrollbars which can cause 1-2px gaps).
      const header = document.querySelector("header");
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const viewportHeight =
        document.documentElement.clientHeight || window.innerHeight;
      const available = Math.max(0, viewportHeight - headerHeight);
      setHeightPx(available);
    };

    computeHeight();
    window.addEventListener("resize", computeHeight);
    const ro = new ResizeObserver(computeHeight);
    if (wrapperRef.current) ro.observe(wrapperRef.current);

    return () => {
      window.removeEventListener("resize", computeHeight);
      ro.disconnect();
    };
  }, []);

  return (
    // place wrapper below the header; AppLayout now removes padding for /user/map
    // avoid negative margins which caused the map to shift upwards
    <div className="w-full" ref={wrapperRef}>
  <PageMeta title={t('pages.userMap.title')} description={t('pages.userMap.description')} />
  <h1 className="sr-only">{t('pages.userMap.title')}</h1>
      {/* Leaflet z-index rules moved to global CSS (src/index.css) managed by Tailwind */}

      <div
        className="w-full h-full overflow-hidden"
        style={
          heightPx
            ? {
                height: `${heightPx}px`,
                boxSizing: "border-box",
                overflow: "hidden",
                margin: 0,
                padding: 0,
                position: "relative",
                zIndex: 0,
              }
            : {
                height: "95vh",
                boxSizing: "border-box",
                overflow: "hidden",
                margin: 0,
                padding: 0,
                position: "relative",
                zIndex: 0,
              }
        }
      >
        <UserMaps height="100%" />
      </div>
    </div>
  );
};

export default UserMapPage;

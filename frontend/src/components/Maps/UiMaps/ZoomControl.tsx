import React from 'react';
import { useMap } from 'react-leaflet';

interface ZoomControlProps {
  btnSize?: { w?: number; h?: number };
}

const ZoomControl: React.FC<ZoomControlProps> = ({ btnSize }) => {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const buttonStyle = {
    width: btnSize?.w || 30,
    height: btnSize?.h || 30,
    backgroundColor: 'white',
    border: '2px solid rgba(0,0,0,0.2)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: '#666'
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleZoomIn}
        style={buttonStyle}
        className="hover:bg-gray-100 transition-colors"
        title="Zoom in"
      >
        +
      </button>
      <button
        onClick={handleZoomOut}
        style={buttonStyle}
        className="hover:bg-gray-100 transition-colors"
        title="Zoom out"
      >
        −
      </button>
    </div>
  );
};

export default ZoomControl;
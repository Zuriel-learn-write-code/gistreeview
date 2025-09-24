import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import BaseButton from "./BaseButton";
import PanelBox from './PanelBox';

export type BaseLayer = "osm" | "carto" | "transport" | "topo" | "dark";

type LayerPickerProps = {
  baseLayer: BaseLayer;
  onChange: (v: BaseLayer) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} & { btnSize?: { w?: number; h?: number } };

const LayerPicker: React.FC<LayerPickerProps> = ({ baseLayer, onChange, btnSize, open, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open !== 'undefined';
  const currentOpen = isControlled ? open : internalOpen;

  const setOpenState = (v: boolean) => {
    if (typeof onOpenChange === 'function') onOpenChange(v);
    if (!isControlled) setInternalOpen(v);
  };

  const { t } = useTranslation();

  return (
    <div className="inline-block">
      <BaseButton
        onClick={() => setOpenState(!currentOpen)}
        title={t('userMap.activeControls.layers')}
        btnSize={btnSize}
        active={currentOpen}
        className={currentOpen ? 'ring-2 ring-blue-400' : ''}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="5" width="14" height="4" rx="1" fill="currentColor" />
          <rect x="5" y="15" width="14" height="4" rx="1" fill="currentColor" />
        </svg>
      </BaseButton>

  {currentOpen && (
        <div className="absolute left-full ml-2" style={{ zIndex: 10005, top: 0 }}>
          <PanelBox width="w-56 sm:w-64" className="rounded-r shadow-2xl">
            <div className="p-0 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h4 className="text-lg sm:text-xl font-semibold px-3 py-2">{t('userMap.activeControls.layers')}</h4>
              <button 
                onClick={() => setOpenState(false)} 
                className="text-gray-500 hover:text-gray-900 dark:text-gray-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors mr-2"
              >
                ×
              </button>
            </div>

            <div className="p-2 sm:p-3 flex flex-col gap-2 sm:gap-3 text-sm sm:text-base">
            {/* Standard */}
            <div
              onClick={() => {
                onChange("osm");
                setOpenState(false);
              }}
              className={`cursor-pointer rounded-lg p-2 flex items-center gap-3 ${
                baseLayer === "osm" ? "bg-blue-500/20 border border-blue-400" : "bg-gray-800/40"
              }`}
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{t('userMap.layers.standard')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.layers.osm')}</div>
              </div>
              <img src="/images/thumbnail-osm.svg" alt="OSM" className="w-20 h-12 rounded object-cover hidden sm:block" />
            </div>

            {/* CartoVoyager (light) */}
            <div
              onClick={() => {
                onChange("carto");
                setOpenState(false);
              }}
              className={`cursor-pointer rounded-lg p-2 flex items-center gap-3 ${
                baseLayer === "carto" ? "bg-blue-500/20 border border-blue-400" : "bg-gray-800/40"
              }`}
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{t('userMap.layers.cartoLight')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.layers.cartoDesc')}</div>
              </div>
              <img src="/images/thumbnail-carto.svg" alt="Carto" className="w-20 h-12 rounded object-cover hidden sm:block" />
            </div>

            {/* CartoVoyager (dark) */}
            <div
              onClick={() => {
                onChange("dark");
                setOpenState(false);
              }}
              className={`cursor-pointer rounded-lg p-2 flex items-center gap-3 ${
                baseLayer === "dark" ? "bg-blue-500/20 border border-blue-400" : "bg-gray-800/40"
              }`}
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{t('userMap.layers.cartoDark')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.layers.cartoDarkDesc')}</div>
              </div>
              <img src="/images/thumbnail-carto.svg" alt="Carto Dark" className="w-20 h-12 rounded object-cover hidden sm:block" />
            </div>
            

            {/* Transport */}
            <div
              onClick={() => {
                onChange("transport");
                setOpenState(false);
              }}
              className={`cursor-pointer rounded-lg p-2 flex items-center gap-3 ${
                baseLayer === "transport" ? "bg-blue-500/20 border border-blue-400" : "bg-gray-800/40"
              }`}
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{t('userMap.layers.transport')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.layers.transportDesc')}</div>
              </div>
              <img src="/images/thumbnail-transport.svg" alt="Transport" className="w-20 h-12 rounded object-cover hidden sm:block" />
            </div>

            {/* Topo */}
            <div
              onClick={() => {
                onChange("topo");
                setOpenState(false);
              }}
              className={`cursor-pointer rounded-lg p-2 flex items-center gap-3 ${
                baseLayer === "topo" ? "bg-blue-500/20 border border-blue-400" : "bg-gray-800/40"
              }`}
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{t('userMap.layers.topo')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">{t('userMap.layers.topoDesc')}</div>
              </div>
              <img src="/images/thumbnail-topo.svg" alt="Topo" className="w-20 h-12 rounded object-cover hidden sm:block" />
            </div>
          </div>
          </PanelBox>
        </div>
      )}
    </div>
  );
};

export default LayerPicker;

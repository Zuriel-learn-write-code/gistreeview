export type TreePicture = { id: string; url: string };

export type Tree = {
  id?: string;
  latitude?: number | string;
  longitude?: number | string;
  species?: string;
  age?: number | string;
  trunk_diameter?: number | string;
  lbranch_width?: number | string;
  status?: 'good' | 'warning' | 'danger' | string;
  description?: string;
  ownership?: string;
  roadId?: string;
  roadName?: string;
  street_name?: string;
  timestamp?: string;
  road?: { id?: string; nameroad?: string } | null;
  treePictures?: TreePicture[] | null;
};

export type RoadsGeoJson = GeoJSON.FeatureCollection | null;

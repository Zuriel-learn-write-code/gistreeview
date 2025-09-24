declare module "*.json" {
  interface TreeData {
    id: string;
    latitude: number;
    longitude: number;
    species: string;
    age: number;
    trunk_diameter: number;
    lbranch_width: number;
    ownership: string;
    street_name: string;
    description: string;
    status: string;
    timestamp: string;
  }
  const value: TreeData[];
  export default value;
}

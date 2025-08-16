export interface Unit {
  id: string;
  name: string;
  sleeps: number;
  propertyId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Property {
  id: string;
  name: string;
  status: string;
  address: string;
  owner: string;
  description: string;
  units: {
    items: Unit[];
  };
}

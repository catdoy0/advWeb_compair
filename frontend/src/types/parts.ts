export interface Part {
  id: number;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  reorder_threshold: number;
  unit_price: number;
  supplier: string | null;
  is_active: boolean;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string | null;
}


export interface InventorySummary {
  total_skus: number;
  needs_reorder: number;
  units_on_hand: number;
  stock_value: number;
}

export interface CreatePartPayload {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  reorder_threshold: number;
  unit_price: number;
  supplier?: string | null;
}

export interface UpdatePartPayload {
  name?: string;
  category?: string;
  reorder_threshold?: number;
  unit_price?: number;
  supplier?: string | null;
}

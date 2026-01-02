/**
 * Core domain types for the storefront.
 * These types match the database schema and views.
 */

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at?: string;
}

export interface Product {
  id: string;
  brand_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  stock_status: 'in_stock' | 'out_of_stock' | 'pre_order';
  images: string[];
  is_featured: boolean;
  is_special_order: boolean;
  weight: number | null;
  search_keywords: string | null;
  category_id: string | null;
  created_at: string;
  brand?: Brand;
  category?: Category;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  unit: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface PetType {
  id: string;
  name: string;
  display_order: number;
  icon: string | null;
}

export interface Pet {
  id: string;
  user_id: string;
  pet_type_id: string;
  name: string;
  breed: string | null;
  birth_date: string | null;
  weight_lbs: number | null;
  dietary_notes: string | null;
  created_at: string;
  updated_at: string;
  pet_type?: PetType;
}

// Product types matching database schema
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  mrp: string;
  sellingPrice: string;
  maxBargainDiscount: string;
  category: "tshirt" | "cargo" | "jogger" | "shirt" | "jeans" | "hoodie" | "jacket" | "shorts" | "accessory";
  gender: "men" | "women" | "unisex";
  tags: string[];
  stock: number;
  images: string[];
  fabric: string | null;
  gsm: number | null;
  careInstructions: string[];
  features: string[];
  sizes: string[];
  colors: ProductColor[];
  variants?: ProductVariant[];
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductColor {
  name: string;
  hex: string;
  images?: string[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  color: string | null;
  stock: number;
}

// Cart types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color?: string;
  comboId?: string;
  comboGroupId?: string;
  comboName?: string;
  comboDiscountPercentage?: number;
  quantity: number;
}

// Order types
export interface Order {
  id: string;
  userId: string | null;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  subtotal: string;
  discount: string;
  shipping: string;
  total: string;
  couponCode: string | null;
  couponDiscount: string | null;
  bargainDiscount: string | null;
  bargainScore: number | null;
  shippingAddress: ShippingAddress | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  productImage: string | null;
  size: string;
  color: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  createdAt: Date;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

// Coupon types
export interface Coupon {
  id: string;
  code: string;
  discountType: "fixed" | "percentage";
  discountValue: string;
  maxDiscount: string | null;
  minOrderValue: string | null;
  validFrom: Date;
  validUntil: Date | null;
  maxUses: number | null;
  usedCount: number;
  forNewUsersOnly: boolean;
  userId: string | null;
  isBargainGenerated: boolean;
  isActive: boolean;
  createdAt: Date;
}

// Bargain AI context
export interface BargainContext {
  id?: string;
  name: string;
  mrp: number;
  sellingPrice: number;
  maxBargainDiscount: number;
  category?: string;
  fabric?: string;
  features?: string[];
}

// API Response types
export interface ProductsResponse {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}

export interface CouponValidationResponse {
  valid: boolean;
  error?: string;
  coupon?: Coupon;
  discount?: number;
}

// User types (from Better Auth)
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: "user" | "admin";
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

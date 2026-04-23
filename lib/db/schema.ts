import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  json,
  uuid,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
export const productCategoryEnum = pgEnum("product_category", [
  "tshirt",
  "cargo",
  "jogger",
  "shirt",
  "jeans",
  "hoodie",
  "jacket",
  "shorts",
  "accessory",
]);
export const productGenderEnum = pgEnum("product_gender", [
  "men",
  "women",
  "unisex",
]);

// ============================================
// BETTER AUTH TABLES (Required by Better Auth)
// ============================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // Better Auth fields
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  // Custom fields
  role: userRoleEnum("role").notNull().default("user"),
  phone: text("phone"),
  // Order tracking for first-time user detection
  ordersCount: integer("orders_count").notNull().default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).notNull().default("0"),
  // Saved shipping address (auto-filled on next checkout)
  shippingAddress: json("shipping_address").$type<{
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  }>(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// PRODUCT TABLES
// ============================================

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  
  // Pricing
  mrp: decimal("mrp", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  maxBargainDiscount: decimal("max_bargain_discount", { precision: 10, scale: 2 }).notNull().default("0"),
  
  // Categorization
  category: productCategoryEnum("category").notNull(),
  gender: productGenderEnum("gender").notNull(),
  tags: json("tags").$type<string[]>().default([]),
  
  // Inventory
  stock: integer("stock").notNull().default(0),
  
  // Images (Cloudinary URLs or local paths)
  images: json("images").$type<string[]>().default([]),
  
  // Product details
  fabric: text("fabric"),
  gsm: integer("gsm"),
  careInstructions: json("care_instructions").$type<string[]>().default([]),
  features: json("features").$type<string[]>().default([]),
  
  // Size & Color variants
  sizes: json("sizes").$type<string[]>().default(["S", "M", "L", "XL"]),
  colors: json("colors").$type<{ name: string; hex: string; images?: string[] }[]>().default([]),
  
  // Metadata
  isNew: boolean("is_new").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  
  // Manual merchandising (gap method with increments of 100)
  displayOrder: integer("display_order").notNull().default(0),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// PRODUCT VARIANTS TABLE (per-size-per-color stock)
// ============================================

export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  size: text("size").notNull(),
  color: text("color"), // null means default/no-color
  stock: integer("stock").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("product_variant_unique").on(table.productId, table.size, table.color),
]);

// ============================================
// COMBOS TABLE
// ============================================

export const combos = pgTable("combos", {
  id: uuid("id").defaultRandom().primaryKey(),
  productAId: uuid("product_a_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  productBId: uuid("product_b_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("combo_pair_unique").on(table.productAId, table.productBId),
]);

// ============================================
// ORDER TABLES
// ============================================

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  
  // Order details
  status: orderStatusEnum("status").notNull().default("pending"),
  
  // Pricing
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  
  // Coupon used
  couponCode: text("coupon_code"),
  couponDiscount: decimal("coupon_discount", { precision: 10, scale: 2 }),
  
  // Bargain info
  bargainDiscount: decimal("bargain_discount", { precision: 10, scale: 2 }),
  bargainScore: integer("bargain_score"),
  
  // Shipping address
  shippingAddress: json("shipping_address").$type<{
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  }>(),
  
  // Payment
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").default("pending"),
  
  // Razorpay fields
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  
  // COD fields
  codFee: decimal("cod_fee", { precision: 10, scale: 2 }),
  codAdvancePaid: decimal("cod_advance_paid", { precision: 10, scale: 2 }),
  codRemainingAmount: decimal("cod_remaining_amount", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "set null" }),
  
  // Product snapshot (in case product changes/deleted)
  productName: text("product_name").notNull(),
  productImage: text("product_image"),
  
  // Selection
  size: text("size").notNull(),
  color: text("color"),
  quantity: integer("quantity").notNull(),
  
  // Pricing at time of order
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// COUPON TABLES
// ============================================

export const coupons = pgTable("coupons", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  
  // Discount
  discountType: text("discount_type").notNull().default("fixed"), // 'fixed' or 'percentage'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }), // For percentage discounts
  
  // Conditions
  minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }),
  
  // Validity
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
  
  // Usage limits
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  
  // User restrictions
  forNewUsersOnly: boolean("for_new_users_only").notNull().default(false),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }), // If specific to user
  
  // Bargain AI generated
  isBargainGenerated: boolean("is_bargain_generated").notNull().default(false),
  
  // Expiry for bargain coupons (5 minutes from generation)
  expiresAt: timestamp("expires_at"),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// BARGAIN SESSIONS TABLE
// ============================================

export const bargainSessions = pgTable("bargain_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  couponCode: text("coupon_code").notNull(),
  cartValue: decimal("cart_value", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// WISHLIST TABLE
// ============================================

export const wishlist = pgTable("wishlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  orders: many(orders),
  wishlist: many(wishlist),
  coupons: many(coupons),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  wishlist: many(wishlist),
  variants: many(productVariants),
  combosAsA: many(combos, { relationName: "comboProductA" }),
  combosAsB: many(combos, { relationName: "comboProductB" }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const combosRelations = relations(combos, ({ one }) => ({
  productA: one(products, {
    fields: [combos.productAId],
    references: [products.id],
    relationName: "comboProductA",
  }),
  productB: one(products, {
    fields: [combos.productBId],
    references: [products.id],
    relationName: "comboProductB",
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(user, {
    fields: [wishlist.userId],
    references: [user.id],
  }),
  product: one(products, {
    fields: [wishlist.productId],
    references: [products.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ one }) => ({
  user: one(user, {
    fields: [coupons.userId],
    references: [user.id],
  }),
}));

export const bargainSessionsRelations = relations(bargainSessions, ({ one }) => ({
  user: one(user, {
    fields: [bargainSessions.userId],
    references: [user.id],
  }),
}));

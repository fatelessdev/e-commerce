"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProduct, type ProductInput } from "@/lib/actions/admin";
import { Loader2, Plus, X, Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const categories = [
  { value: "tshirt", label: "T-Shirt" },
  { value: "cargo", label: "Cargo" },
  { value: "jogger", label: "Jogger" },
  { value: "shirt", label: "Shirt" },
  { value: "jeans", label: "Jeans" },
  { value: "hoodie", label: "Hoodie" },
  { value: "jacket", label: "Jacket" },
  { value: "shorts", label: "Shorts" },
  { value: "accessory", label: "Accessory" },
];

const genders = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex" },
];

const defaultSizes = ["S", "M", "L", "XL", "XXL"];
const numberSizes = ["26", "28", "30", "32", "34"];
const NUMBER_SIZE_CATEGORIES = ["jogger", "jeans", "cargo", "shorts"];

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  mrp: string;
  sellingPrice: string;
  maxBargainDiscount: string;
  category: ProductInput["category"];
  gender: ProductInput["gender"];
  stock: number;
  fabric: string | null;
  gsm: number | null;
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  images: string[] | null;
  sizes: string[] | null;
  careInstructions: string[] | null;
  features: string[] | null;
  colors: { name: string; hex: string; images?: string[] }[] | null;
  tags: string[] | null;
  variants?: { id: string; productId: string; size: string; color: string | null; stock: number }[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    mrp: "",
    sellingPrice: "",
    maxBargainDiscount: "",
    category: "tshirt" as ProductInput["category"],
    gender: "unisex" as ProductInput["gender"],
    stock: 0,
    fabric: "",
    gsm: 0,
    isNew: false,
    isFeatured: false,
    isActive: true,
    displayOrder: 0,
  });

  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sizes, setSizes] = useState<string[]>([]);
  const [careInstructions, setCareInstructions] = useState<string[]>([]);
  const [newCareInstruction, setNewCareInstruction] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
  const [newColor, setNewColor] = useState({ name: "", hex: "#000000" });
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [variantStock, setVariantStock] = useState<Record<string, number>>({});
  const isAccessory = formData.category === "accessory";

  // Fetch product data on mount
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const product: ProductData = await res.json();

        setFormData({
          name: product.name,
          slug: product.slug,
          description: product.description || "",
          mrp: product.mrp,
          sellingPrice: product.sellingPrice,
          maxBargainDiscount: product.maxBargainDiscount || "",
          category: product.category,
          gender: product.gender,
          stock: product.stock,
          fabric: product.fabric || "",
          gsm: product.gsm || 0,
          isNew: product.isNew,
          isFeatured: product.isFeatured,
          isActive: product.isActive,
          displayOrder: product.displayOrder || 0,
        });
        setImages(product.images || []);
        setSizes(product.sizes || ["S", "M", "L", "XL"]);
        setCareInstructions(product.careInstructions || []);
        setFeatures(product.features || []);
        setColors(product.colors || []);
        setTags(product.tags || []);

        // Populate variant stock from fetched variants
        if (product.variants && product.variants.length > 0) {
          const stockMap: Record<string, number> = {};
          for (const v of product.variants) {
            const key = `${v.size}|${v.color || ""}`;
            stockMap[key] = v.stock;
          }
          setVariantStock(stockMap);
        }
      } catch {
        setError("Failed to load product");
      } finally {
        setIsFetching(false);
      }
    }

    fetchProduct();
  }, [productId]);

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      for (const file of Array.from(files)) {
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("folder", "xilar/products");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        setImages((prev) => [...prev, data.url]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Build variants array from the stock matrix
      const effectiveSizes = isAccessory ? ["One Size"] : sizes;
      const effectiveColors = isAccessory ? [] : colors;
      const variants: { size: string; color: string | null; stock: number }[] = [];

      for (const size of effectiveSizes) {
        if (effectiveColors.length > 0) {
          for (const color of effectiveColors) {
            const key = `${size}|${color.name}`;
            variants.push({ size, color: color.name, stock: variantStock[key] || 0 });
          }
        } else {
          const key = `${size}|`;
          variants.push({ size, color: null, stock: variantStock[key] || 0 });
        }
      }

      const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

      const productData: ProductInput = {
        ...formData,
        gender: isAccessory ? "unisex" : formData.gender,
        stock: totalStock,
        images,
        sizes: effectiveSizes,
        careInstructions: isAccessory ? [] : careInstructions,
        features: isAccessory ? [] : features,
        colors: effectiveColors,
        tags,
        variants,
        fabric: isAccessory ? undefined : (formData.fabric || undefined),
        gsm: isAccessory ? undefined : (formData.gsm || undefined),
      };

      await updateProduct(productId, productData);
      router.push("/admin/products");
    } catch (err) {
      console.error("Failed to update product:", err);
      setError(err instanceof Error ? err.message : "Failed to update product");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <p className="text-muted-foreground">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/admin/products">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon" aria-label="Back to products">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">
            Update product details
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="Street Cargo Pants"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="street-cargo-pants"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-background min-h-[100px]"
                placeholder="Product description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => {
                    const category = e.target.value as ProductInput["category"];
                    setFormData((prev) => ({
                      ...prev,
                      category,
                      gender: category === "accessory" ? "unisex" : prev.gender,
                    }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              {!isAccessory ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gender *</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as ProductInput["gender"] })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    {genders.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gender</label>
                  <input
                    value="Unisex (auto for accessories)"
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-muted text-muted-foreground"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">MRP (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="2999"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Selling Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="1999"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Bargain Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maxBargainDiscount}
                  onChange={(e) => setFormData({ ...formData, maxBargainDiscount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload from Device</label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                    {uploading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span>Click to upload images</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, WebP. Max 10MB per file.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Or add image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg bg-background"
                  placeholder="https://example.com/image.jpg"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (newImageUrl) {
                      setImages([...images, newImageUrl]);
                      setNewImageUrl("");
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {images.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Images ({images.length})</label>
                <div className="flex flex-wrap gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <Image
                        src={img}
                        alt={`Product ${idx + 1}`}
                        width={96}
                        height={96}
                        className="w-24 h-24 object-cover rounded border"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          className="p-1.5 bg-destructive text-destructive-foreground rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground rounded">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAccessory && (
            <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fabric</label>
                <input
                  type="text"
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="100% Premium Cotton"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">GSM</label>
                <input
                  type="number"
                  min="0"
                  value={formData.gsm || ""}
                  onChange={(e) => setFormData({ ...formData, gsm: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="240"
                />
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sizes</label>
              <div className="flex flex-wrap gap-2">
                {(NUMBER_SIZE_CATEGORIES.includes(formData.category) ? numberSizes : defaultSizes).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      if (sizes.includes(size)) {
                        setSizes(sizes.filter((s) => s !== size));
                      } else {
                        setSizes([...sizes, size]);
                      }
                    }}
                    className={`px-3 py-1 border rounded ${
                      sizes.includes(size)
                        ? "bg-primary text-primary-foreground"
                        : "bg-background"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Colors</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newColor.name}
                  onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg bg-background"
                  placeholder="Color name (e.g., Midnight Black)"
                />
                <input
                  type="color"
                  value={newColor.hex}
                  onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                  className="w-12 h-10 border rounded-lg cursor-pointer"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (newColor.name) {
                      setColors([...colors, newColor]);
                      setNewColor({ name: "", hex: "#000000" });
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {colors.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-2 py-1 border rounded-full"
                    >
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-sm">{color.name}</span>
                      <button
                        type="button"
                        onClick={() => setColors(colors.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </>
            )}

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg bg-background"
                  placeholder="e.g., bestseller"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (newTag) {
                      setTags([...tags, newTag]);
                      setNewTag("");
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {!isAccessory && (
            <>
            {/* Features */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Features</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg bg-background"
                  placeholder="Pre-shrunk fabric"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (newFeature) {
                      setFeatures([...features, newFeature]);
                      setNewFeature("");
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Care Instructions */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Care Instructions</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCareInstruction}
                  onChange={(e) => setNewCareInstruction(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg bg-background"
                  placeholder="Machine wash cold"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (newCareInstruction) {
                      setCareInstructions([...careInstructions, newCareInstruction]);
                      setNewCareInstruction("");
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {careInstructions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {careInstructions.map((inst, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
                    >
                      {inst}
                      <button
                        type="button"
                        onClick={() => setCareInstructions(careInstructions.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            </>
            )}
          </CardContent>
        </Card>

        {/* Inventory Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory (Stock per Variant)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAccessory ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock</label>
                <input
                  type="number"
                  min="0"
                  value={variantStock["One Size|"] || 0}
                  onChange={(e) =>
                    setVariantStock({
                      ...variantStock,
                      ["One Size|"]: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Accessories use a single inventory bucket (no size/color variants).
                </p>
              </div>
            ) : (
              (() => {
                const effectiveSizes = sizes;
                const totalStock = effectiveSizes.reduce((sum, size) => {
                  if (colors.length > 0) {
                    return sum + colors.reduce((colorSum, color) => colorSum + (variantStock[`${size}|${color.name}`] || 0), 0);
                  }
                  return sum + (variantStock[`${size}|`] || 0);
                }, 0);

                if (effectiveSizes.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground">
                      Add sizes above to configure inventory.
                    </p>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Size</th>
                            {colors.length > 0 ? (
                              colors.map((color) => (
                                <th key={color.name} className="p-2 font-medium text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <div
                                      className="w-3 h-3 rounded-full border"
                                      style={{ backgroundColor: color.hex }}
                                    />
                                    {color.name}
                                  </div>
                                </th>
                              ))
                            ) : (
                              <th className="p-2 font-medium text-center">Stock</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {effectiveSizes.map((size) => (
                            <tr key={size} className="border-b last:border-0">
                              <td className="p-2 font-medium">{size}</td>
                              {colors.length > 0 ? (
                                colors.map((color) => {
                                  const key = `${size}|${color.name}`;
                                  return (
                                    <td key={key} className="p-2">
                                      <input
                                        type="number"
                                        min="0"
                                        value={variantStock[key] || 0}
                                        onChange={(e) =>
                                          setVariantStock({
                                            ...variantStock,
                                            [key]: parseInt(e.target.value) || 0,
                                          })
                                        }
                                        className="w-full px-2 py-1 border rounded bg-background text-center"
                                      />
                                    </td>
                                  );
                                })
                              ) : (
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={variantStock[`${size}|`] || 0}
                                    onChange={(e) =>
                                      setVariantStock({
                                        ...variantStock,
                                        [`${size}|`]: parseInt(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full px-2 py-1 border rounded bg-background text-center"
                                  />
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        {effectiveSizes.length * Math.max(colors.length, 1)} variants
                      </span>
                      <span className="text-sm font-medium">
                        Total Stock: <span className={totalStock === 0 ? "text-destructive" : "text-green-500"}>{totalStock}</span>
                      </span>
                    </div>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>

        {/* Status & Display Order */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Display Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Active (visible in store)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isNew}
                  onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Mark as New</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Mark as Best Seller</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Home page Best Sellers are controlled manually with this toggle.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">Display Order (Manual Merchandising)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg bg-background"
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Higher values appear first. Use increments of 100 (e.g., 100, 200, 300) for easy reordering. Default 0 = sort by newest.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

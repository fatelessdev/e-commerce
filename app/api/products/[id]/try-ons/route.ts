import { readFile } from "node:fs/promises";
import path from "node:path";
import { generateImage } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { createProductTryOnRun, listProductTryOnRuns } from "@/lib/actions/try-on";
import { uploadImage } from "@/lib/cloudinary";
import { getProductDetails } from "@/lib/product-detail";
import { normalizeProductImage } from "@/lib/image";
import { openrouter } from "@/lib/openrouter";
import { requireTryOnAccess } from "@/lib/try-on-access";
import { debitWalletForGeneration, reverseGenerationCharge, WALLET_LIMITS } from "@/lib/wallet";
import {
  TRY_ON_PROMPT_VERSION,
  buildTryOnPrompt,
  buildTryOnAssetPublicId,
  getRequiredTryOnMode,
  getTryOnModelId,
  isTryOnBodyMode,
  isTryOnBodyModeAllowed,
  validateTryOnImageFile,
} from "@/lib/try-on";

export const runtime = "nodejs";
export const maxDuration = 60;

function forbiddenOrUnauthorized(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (/unauthorized|auth/i.test(message)) {
    return NextResponse.json({ error: "Sign in to use try-on." }, { status: 401 });
  }

  return null;
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

async function loadProductImageForGeneration(imageUrl: string): Promise<string | Buffer> {
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  const publicRoot = path.resolve(process.cwd(), "public");
  const filePath = path.resolve(publicRoot, imageUrl.replace(/^\/+/, ""));

  if (!filePath.startsWith(publicRoot + path.sep)) {
    throw new Error("Invalid product image path");
  }

  return readFile(filePath);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTryOnAccess();
    const { id: productId } = await params;

    return NextResponse.json({
      runs: await listProductTryOnRuns(productId, session.user.id),
    });
  } catch (error) {
    const accessResponse = forbiddenOrUnauthorized(error);
    if (accessResponse) return accessResponse;

    console.error("Try-on history error:", error);
    return NextResponse.json({ error: "Could not load try-on previews." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTryOnAccess();
    const { id: productId } = await params;
    const formData = await req.formData();
    const file = formData.get("bodyImage");
    const productImageIndexValue = formData.get("productImageIndex");
    const bodyModeValue = formData.get("bodyMode");
    const requestId = formData.get("requestId");

    if (!(file instanceof File)) {
      return badRequest("Upload a body photo to generate a try-on preview.");
    }
    if (typeof requestId !== "string" || !/^[a-f0-9-]{36}$/i.test(requestId)) return badRequest("Invalid generation request.");

    const fileValidation = validateTryOnImageFile(file);
    if (!fileValidation.ok) {
      return badRequest(fileValidation.error);
    }

    if (typeof productImageIndexValue !== "string") {
      return badRequest("Choose a product image for the try-on reference.");
    }

    const productImageIndex = Number(productImageIndexValue);
    if (!Number.isInteger(productImageIndex) || productImageIndex < 0) {
      return badRequest("Choose a valid product image.");
    }

    if (typeof bodyModeValue !== "string" || !isTryOnBodyMode(bodyModeValue)) {
      return badRequest("Choose whether the body photo is upper, lower, or full body.");
    }

    const product = await getProductDetails(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const requiredMode = getRequiredTryOnMode(product.category);
    if (requiredMode === "unsupported") {
      return badRequest("Try-on is not supported for this product category yet.");
    }

    if (!isTryOnBodyModeAllowed(requiredMode, bodyModeValue)) {
      return badRequest(
        requiredMode === "upper"
          ? "Use an upper-body or full-body photo for this product."
          : "Use a lower-body or full-body photo for this product.",
      );
    }

    const productImages = product.images?.map((image) => normalizeProductImage(image)) ?? [];
    const productImageUrl = productImages[productImageIndex];
    if (!productImageUrl) {
      return badRequest("Choose a valid product image.");
    }

    const bodyBuffer = Buffer.from(await file.arrayBuffer());
    const productImageReference = await loadProductImageForGeneration(productImageUrl);
    const modelId = getTryOnModelId();
    const prompt = buildTryOnPrompt({
      productName: product.name,
      category: product.category,
      requiredMode,
    });

    try {
      await debitWalletForGeneration(session.user.id, requestId);
    } catch (walletError) {
      const message = walletError instanceof Error ? walletError.message : "Wallet payment is unavailable.";
      if (/insufficient|frozen|balance/i.test(message)) {
        return NextResponse.json({
          error: "You need at least ₹7 in your XILAR Wallet to generate a try-on.",
          code: "WALLET_INSUFFICIENT",
          walletUrl: "/account/wallet",
        }, { status: 402 });
      }
      throw walletError;
    }
    let charged = true;
    try {
    const { image } = await generateImage({
      model: openrouter.imageModel(modelId),
      prompt: {
        text: prompt,
        images: [bodyBuffer, productImageReference],
      },
      n: 1,
      maxRetries: 1,
    });

    const outputBuffer = Buffer.from(image.uint8Array);
    const timestamp = Date.now();
    const [bodyUpload, outputUpload] = await Promise.all([
      uploadImage(bodyBuffer, {
        folder: "xilar/try-ons/body",
        publicId: buildTryOnAssetPublicId({
          productId,
          userId: session.user.id,
          timestamp,
          kind: "body",
        }),
        mediaType: file.type,
        deliveryType: "authenticated",
      }),
      uploadImage(outputBuffer, {
        folder: "xilar/try-ons/output",
        publicId: buildTryOnAssetPublicId({
          productId,
          userId: session.user.id,
          timestamp,
          kind: "output",
        }),
        mediaType: image.mediaType || "image/png",
        deliveryType: "authenticated",
      }),
    ]);

    const run = await createProductTryOnRun({
      productId,
      userId: session.user.id,
      bodyImageUrl: bodyUpload.url,
      bodyImagePublicId: bodyUpload.publicId,
      outputImageUrl: outputUpload.url,
      outputImagePublicId: outputUpload.publicId,
      productImageUrl,
      productImageIndex,
      tryOnMode: bodyModeValue,
      modelId,
      promptVersion: TRY_ON_PROMPT_VERSION,
    });

    return NextResponse.json({ run }, { status: 201 });
    } catch (generationError) {
      if (charged) await reverseGenerationCharge(session.user.id, requestId).catch(() => undefined);
      throw generationError;
    }
  } catch (error) {
    const accessResponse = forbiddenOrUnauthorized(error);
    if (accessResponse) return accessResponse;

    console.error("Try-on generation error:", error);
    return NextResponse.json({ error: "Could not generate try-on preview." }, { status: 500 });
  }
}

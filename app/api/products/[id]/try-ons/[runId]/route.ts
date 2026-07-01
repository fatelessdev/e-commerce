import { NextRequest, NextResponse } from "next/server";
import {
  deleteOwnedProductTryOnRun,
  getOwnedProductTryOnRun,
} from "@/lib/actions/try-on";
import { deleteImage } from "@/lib/cloudinary";
import { requireTryOnAccess } from "@/lib/try-on-access";

function forbiddenOrUnauthorized(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (/unauthorized|auth/i.test(message)) {
    return NextResponse.json({ error: "Sign in to use try-on." }, { status: 401 });
  }

  if (/forbidden|admin-only/i.test(message)) {
    return NextResponse.json({ error: "Try-on testing is currently admin-only." }, { status: 403 });
  }

  return null;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> },
) {
  try {
    const session = await requireTryOnAccess();
    const { id: productId, runId } = await params;
    const run = await getOwnedProductTryOnRun({
      productId,
      runId,
      userId: session.user.id,
    });

    if (!run) {
      return NextResponse.json({ error: "Try-on preview not found." }, { status: 404 });
    }

    await Promise.all([
      deleteImage(run.bodyImagePublicId),
      deleteImage(run.outputImagePublicId),
    ]);

    await deleteOwnedProductTryOnRun({
      productId,
      runId,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const accessResponse = forbiddenOrUnauthorized(error);
    if (accessResponse) return accessResponse;

    console.error("Try-on delete error:", error);
    return NextResponse.json({ error: "Could not delete try-on preview." }, { status: 500 });
  }
}

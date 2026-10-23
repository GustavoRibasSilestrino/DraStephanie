import { json, errorResponse, readJson, requireAdmin } from "@/lib/api";
import { blockSchema, createBlock, listBlocks } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    return json({ blocks: await listBlocks() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const block = await createBlock(blockSchema.parse(await readJson(req)));
    return json({ block }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

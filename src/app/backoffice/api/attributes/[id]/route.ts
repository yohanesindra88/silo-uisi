import { AttributeController } from "@/controllers/attribute.controller";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return AttributeController.updateAttribute(req, Number(id));
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return AttributeController.deleteAttribute(req, Number(id));
}

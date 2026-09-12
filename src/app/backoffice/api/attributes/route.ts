import { AttributeController } from "@/controllers/attribute.controller";

export async function GET(req: Request) {
  return AttributeController.getAttributes(req);
}

export async function POST(req: Request) {
  return AttributeController.createAttribute(req);
}

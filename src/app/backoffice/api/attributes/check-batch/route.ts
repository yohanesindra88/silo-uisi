import { AttributeController } from "@/controllers/attribute.controller";

export async function POST(req: Request) {
  return AttributeController.batchCheck(req);
}

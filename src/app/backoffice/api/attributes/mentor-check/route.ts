import { AttributeController } from "@/controllers/attribute.controller";

export async function GET(req: Request) {
  return AttributeController.getMentorCheck(req);
}

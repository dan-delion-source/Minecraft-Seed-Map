import { NextRequest } from "next/server";
import { generate } from "@/lib/generation";
export const runtime = "nodejs";
export function GET(request: NextRequest) { return generate(request, "structures"); }

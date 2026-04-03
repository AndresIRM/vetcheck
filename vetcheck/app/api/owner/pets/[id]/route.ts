import { NextResponse } from "next/server";

type Ctx = {
  params: Promise<{ id: string }> | { id: string };
};

async function getParams(ctx: Ctx) {
  return typeof (ctx.params as any)?.then === "function"
    ? await (ctx.params as Promise<{ id: string }>)
    : (ctx.params as { id: string });
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await getParams(ctx);

  return NextResponse.json({
    ok: true,
    id,
  });
}
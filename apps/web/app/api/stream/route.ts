import { createMetricsEngine } from "@/lib/metrics";

// Long-lived streaming connection: never statically optimized, Node runtime.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REFRESH_MS = Number(process.env.METRICS_REFRESH_MS ?? 2000);

/**
 * Server-Sent Events endpoint. Emits a full StreamEvent envelope every
 * METRICS_REFRESH_MS. Each connection gets its own seeded engine so cumulative
 * values (revenue, bytes transferred) advance independently and coherently.
 */
export async function GET(request: Request) {
  const engine = createMetricsEngine({ intervalMs: REFRESH_MS });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        const event = engine.tick();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      // Emit immediately so the client paints without waiting a full tick.
      send();
      const interval = setInterval(send, REFRESH_MS);

      const close = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      // Tear down when the client disconnects.
      request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

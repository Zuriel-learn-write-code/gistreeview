import { PrismaClient } from "@prisma/client";

// Quick workaround for serverless / pooled environments (PgBouncer) where
// prepared statements can collide across reused connections. If the env var
// isn't already set, set it so Prisma will disable prepared statements.
if (!process.env.PRISMA_DISABLE_PREPARED_STATEMENTS) {
  process.env.PRISMA_DISABLE_PREPARED_STATEMENTS = "1";
}

// Enable query logging during development to help debug intermittent failures.
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "production"
      ? []
      : [
          { level: "query", emit: "event" },
          { level: "error", emit: "event" },
        ],
});

if (process.env.NODE_ENV !== "production") {
  prisma.$on("query", (e) => {
    // Avoid logging full SQL with sensitive data in production; helpful in dev.
    console.debug(
      "[prisma] query:",
      e.query,
      "params length:",
      e.params?.length || 0,
      "duration:",
      e.duration
    );
  });
  prisma.$on("error", (e) => {
    console.error("[prisma] error event:", e.message || e);
  });
}

// Prisma middleware: retry once on prepared-statement collisions which can occur
// in pooled/serverless environments (Postgres 42P05 / message contains 'prepared statement').
prisma.$use(async (params, next) => {
  let attempt = 0;
  while (true) {
    try {
      return await next(params);
    } catch (err) {
      const msg = err?.message || "";
      const code = err?.code || "";
      if (attempt === 0 && (code === "42P05" || msg.toLowerCase().includes("prepared statement"))) {
        console.warn("Prisma middleware detected prepared-statement error, reconnecting and retrying once", { code, message: msg });
        attempt++;
        try {
          await prisma.$disconnect();
        } catch (e) {
          /* ignore */
        }
        try {
          await prisma.$connect();
        } catch (e) {
          console.error("Prisma reconnect failed during retry:", e && e.stack ? e.stack : e);
          // If reconnect fails, throw original error
          throw err;
        }
        // retry loop
        continue;
      }
      throw err;
    }
  }
});

export default prisma;

export function formatPrismaError(err) {
  if (!err) return null;
  // Common Prisma error shapes include `code`, `meta`, `message`
  return {
    message: err.message || String(err),
    code: err.code || null,
    meta: err.meta || null,
  };
}

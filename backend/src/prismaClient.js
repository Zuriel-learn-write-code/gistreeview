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

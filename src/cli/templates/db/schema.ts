export function schemaStub(name: string): string {
  return `import { pgTable, serial, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const ${name} = pgTable("${name}", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
`;
}

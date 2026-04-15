import { relations } from "drizzle-orm"
import { users } from "./users"

// Relations will be expanded as more schemas are added in later phases
export const usersRelations = relations(users, ({ }) => ({}))

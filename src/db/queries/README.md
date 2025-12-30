# Database Queries

This directory contains **ALL database operations** for the application.

## 🚨 CRITICAL RULES

1. **ALL database queries MUST be defined in this directory**
2. **NEVER write database queries directly in Server Components or Server Actions**
3. **NEVER import `db` from "@/db" outside of this directory**

## Purpose

This directory serves as the **single source of truth** for all database operations. By centralizing database logic here, we achieve:

- **Security**: Consistent userId filtering and ownership verification
- **Reusability**: Query functions can be used across multiple components and actions
- **Testability**: Query functions can be tested independently
- **Maintainability**: Database logic is organized and easy to find
- **Type Safety**: Strong TypeScript types throughout the data layer

## Organization

Files are organized by domain/entity:

```
queries/
├── deck-queries.ts     # All deck-related queries and mutations
├── card-queries.ts     # All card-related queries and mutations
└── README.md          # This file
```

## Function Naming Conventions

### Read Operations (SELECT)
- `getUserDecks(userId)` - Get all decks for a user
- `getDeckById(deckId, userId)` - Get a specific deck
- `getDeckCards(deckId, userId)` - Get all cards in a deck

### Create Operations (INSERT)
- `createDeckForUser(userId, data)` - Create a new deck
- `createCardForDeck(deckId, userId, data)` - Create a new card

### Update Operations (UPDATE)
- `updateDeckForUser(deckId, userId, data)` - Update a deck
- `updateCardForUser(cardId, userId, data)` - Update a card

### Delete Operations (DELETE)
- `deleteDeckForUser(deckId, userId)` - Delete a deck
- `deleteCardForUser(cardId, userId)` - Delete a card

## Usage

### In Server Components

```typescript
// app/decks/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserDecks } from "@/db/queries/deck-queries";

export default async function DecksPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");
  
  // Call query function
  const decks = await getUserDecks(userId);
  
  return <div>{/* Render decks */}</div>;
}
```

### In Server Actions

```typescript
// app/actions/deck-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createDeckForUser } from "@/db/queries/deck-queries";

const createDeckSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

type CreateDeckInput = z.infer<typeof createDeckSchema>;

export async function createDeck(input: CreateDeckInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  const validated = createDeckSchema.parse(input);
  
  // Call mutation function
  const deck = await createDeckForUser(userId, validated);
  
  revalidatePath("/decks");
  return deck;
}
```

## Security Guidelines

### Always Filter by userId

Every query function that accesses user-owned resources MUST accept `userId` as a parameter:

```typescript
// ✅ CORRECT
export async function getUserDecks(userId: string) {
  return await db
    .select()
    .from(decksTable)
    .where(eq(decksTable.userId, userId));
}

// ❌ WRONG - Missing userId parameter
export async function getAllDecks() {
  return await db.select().from(decksTable);
}
```

### Verify Ownership Before Mutations

Update and delete operations MUST verify ownership before proceeding:

```typescript
export async function updateDeckForUser(
  deckId: number,
  userId: string,
  data: { name: string; description?: string }
) {
  // 1. Verify ownership
  const existing = await getDeckById(deckId, userId);
  if (!existing) {
    throw new Error("Deck not found or unauthorized");
  }
  
  // 2. Perform update
  const [updated] = await db
    .update(decksTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(decksTable.id, deckId))
    .returning();
  
  return updated;
}
```

### Handle Related Resources

When querying related resources (e.g., cards via decks), verify ownership through the parent:

```typescript
export async function getDeckCards(deckId: number, userId: string) {
  // Verify deck ownership first
  const deck = await getDeckById(deckId, userId);
  if (!deck) return null;
  
  // Then fetch cards
  return await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.deckId, deckId));
}
```

## Error Handling

### Return null for Not Found

Read operations should return `null` if a resource is not found:

```typescript
export async function getDeckById(deckId: number, userId: string) {
  const [deck] = await db
    .select()
    .from(decksTable)
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.userId, userId)
    ));
  
  return deck || null; // Return null if not found
}
```

### Throw Errors for Unauthorized Access

Write operations should throw errors for unauthorized access:

```typescript
export async function deleteDeckForUser(deckId: number, userId: string) {
  const existing = await getDeckById(deckId, userId);
  if (!existing) {
    throw new Error("Deck not found or unauthorized");
  }
  
  await db.delete(decksTable).where(eq(decksTable.id, deckId));
}
```

## Documentation

Every query function should have JSDoc comments:

```typescript
/**
 * Get all decks for a specific user
 * @param userId - The authenticated user's ID
 * @returns Array of user's decks
 */
export async function getUserDecks(userId: string) {
  // ...
}
```

## Testing

Query functions are designed to be testable independently of Server Components and Actions:

```typescript
// In tests
import { getUserDecks } from "@/db/queries/deck-queries";

describe("getUserDecks", () => {
  it("should return only decks owned by the user", async () => {
    const decks = await getUserDecks("user-123");
    expect(decks).toEqual([/* expected decks */]);
  });
});
```

## Common Patterns

### Pattern 1: Simple Read with userId Filter

```typescript
export async function getUserDecks(userId: string) {
  return await db
    .select()
    .from(decksTable)
    .where(eq(decksTable.userId, userId));
}
```

### Pattern 2: Read with Ownership Verification

```typescript
export async function getDeckById(deckId: number, userId: string) {
  const [deck] = await db
    .select()
    .from(decksTable)
    .where(and(
      eq(decksTable.id, deckId),
      eq(decksTable.userId, userId)
    ));
  
  return deck || null;
}
```

### Pattern 3: Create with userId

```typescript
export async function createDeckForUser(
  userId: string,
  data: { name: string; description?: string }
) {
  const [deck] = await db
    .insert(decksTable)
    .values({ userId, ...data })
    .returning();
  
  return deck;
}
```

### Pattern 4: Update with Ownership Verification

```typescript
export async function updateDeckForUser(
  deckId: number,
  userId: string,
  data: { name: string; description?: string }
) {
  // Verify ownership
  const existing = await getDeckById(deckId, userId);
  if (!existing) {
    throw new Error("Deck not found or unauthorized");
  }
  
  const [updated] = await db
    .update(decksTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(decksTable.id, deckId))
    .returning();
  
  return updated;
}
```

### Pattern 5: Delete with Ownership Verification

```typescript
export async function deleteDeckForUser(deckId: number, userId: string) {
  // Verify ownership
  const existing = await getDeckById(deckId, userId);
  if (!existing) {
    throw new Error("Deck not found or unauthorized");
  }
  
  await db.delete(decksTable).where(eq(decksTable.id, deckId));
}
```

### Pattern 6: Related Resource Access

```typescript
export async function getDeckCards(deckId: number, userId: string) {
  // Verify parent ownership
  const deck = await getDeckById(deckId, userId);
  if (!deck) return null;
  
  // Fetch related resources
  return await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.deckId, deckId));
}
```

## Remember

- 🔒 **Security First**: Always filter by userId for user-owned resources
- 🔄 **Reusability**: Design functions to be called from multiple places
- 📝 **Documentation**: Use JSDoc comments for all functions
- ✅ **Type Safety**: Leverage TypeScript types from Drizzle
- 🧪 **Testability**: Keep functions pure and independently testable
- ❌ **No Shortcuts**: Never bypass this layer, even for "simple" queries


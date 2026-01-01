/**
 * Deck Queries
 * 
 * All database operations related to decks.
 * These functions handle data access with proper userId filtering and ownership verification.
 */

import { db } from "@/db";
import { decksTable, cardsTable } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get all decks for a specific user
 * @param userId - The authenticated user's ID
 * @returns Array of user's decks
 */
export async function getUserDecks(userId: string) {
  return await db
    .select()
    .from(decksTable)
    .where(eq(decksTable.userId, userId));
}

/**
 * Get all decks for a specific user with card counts
 * @param userId - The authenticated user's ID
 * @returns Array of user's decks with cardCount property
 */
export async function getUserDecksWithCardCount(userId: string) {
  const decks = await db
    .select({
      id: decksTable.id,
      userId: decksTable.userId,
      name: decksTable.name,
      description: decksTable.description,
      createdAt: decksTable.createdAt,
      updatedAt: decksTable.updatedAt,
      cardCount: sql<number>`count(${cardsTable.id})::int`,
    })
    .from(decksTable)
    .leftJoin(cardsTable, eq(decksTable.id, cardsTable.deckId))
    .where(eq(decksTable.userId, userId))
    .groupBy(decksTable.id)
    .orderBy(desc(decksTable.updatedAt));
  
  return decks;
}

/**
 * Get the count of decks for a user
 * Used to enforce deck limits for free users
 * @param userId - The authenticated user's ID
 * @returns The number of decks the user has
 */
export async function getUserDeckCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(decksTable)
    .where(eq(decksTable.userId, userId));
  
  return result[0]?.count ?? 0;
}

/**
 * Get a specific deck by ID (with user ownership check)
 * @param deckId - The deck ID
 * @param userId - The authenticated user's ID
 * @returns The deck if found and owned by user, null otherwise
 */
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

/**
 * Get all cards for a specific deck (with user ownership check)
 * Sorted by updatedAt date (latest first)
 * @param deckId - The deck ID
 * @param userId - The authenticated user's ID
 * @returns Array of cards if deck is owned by user, null if unauthorized
 */
export async function getDeckCards(deckId: number, userId: string) {
  // Verify deck ownership first
  const deck = await getDeckById(deckId, userId);
  if (!deck) return null;
  
  return await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.deckId, deckId))
    .orderBy(desc(cardsTable.updatedAt));
}

// ============================================
// WRITE OPERATIONS
// ============================================

/**
 * Create a new deck for a user
 * @param userId - The authenticated user's ID
 * @param data - Deck data (name, description)
 * @returns The created deck
 */
export async function createDeckForUser(
  userId: string,
  data: { name: string; description?: string }
) {
  const [deck] = await db
    .insert(decksTable)
    .values({
      userId,
      name: data.name,
      description: data.description,
    })
    .returning();
  
  return deck;
}

/**
 * Update a deck (with user ownership check)
 * @param deckId - The deck ID
 * @param userId - The authenticated user's ID
 * @param data - Updated deck data (name, description)
 * @returns The updated deck
 * @throws Error if deck not found or user is not the owner
 */
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
    .set({
      name: data.name,
      description: data.description,
      updatedAt: new Date(),
    })
    .where(eq(decksTable.id, deckId))
    .returning();
  
  return updated;
}

/**
 * Delete a deck (with user ownership check)
 * @param deckId - The deck ID
 * @param userId - The authenticated user's ID
 * @throws Error if deck not found or user is not the owner
 */
export async function deleteDeckForUser(deckId: number, userId: string) {
  // Verify ownership
  const existing = await getDeckById(deckId, userId);
  if (!existing) {
    throw new Error("Deck not found or unauthorized");
  }
  
  // Delete will cascade to cards due to foreign key constraint
  await db.delete(decksTable).where(eq(decksTable.id, deckId));
}


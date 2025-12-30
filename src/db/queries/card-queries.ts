/**
 * Card Queries
 * 
 * All database operations related to cards.
 * These functions handle data access with proper userId filtering (via deck ownership) and ownership verification.
 */

import { db } from "@/db";
import { cardsTable, decksTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getDeckById } from "./deck-queries";

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get a specific card by ID (with user ownership check via deck)
 * @param cardId - The card ID
 * @param userId - The authenticated user's ID
 * @returns The card if found and owned by user (via deck), null otherwise
 */
export async function getCardById(cardId: number, userId: string) {
  const result = await db
    .select({
      card: cardsTable,
      deck: decksTable,
    })
    .from(cardsTable)
    .leftJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
    .where(and(
      eq(cardsTable.id, cardId),
      eq(decksTable.userId, userId)
    ));
  
  return result[0]?.card || null;
}

/**
 * Get all cards for a specific user (across all their decks)
 * @param userId - The authenticated user's ID
 * @returns Array of all cards owned by the user
 */
export async function getAllUserCards(userId: string) {
  const result = await db
    .select({
      card: cardsTable,
      deck: decksTable,
    })
    .from(cardsTable)
    .leftJoin(decksTable, eq(cardsTable.deckId, decksTable.id))
    .where(eq(decksTable.userId, userId));
  
  return result.map(r => ({ ...r.card, deckName: r.deck?.name }));
}

// ============================================
// WRITE OPERATIONS
// ============================================

/**
 * Create a new card in a deck (with user ownership check)
 * @param deckId - The deck ID to add the card to
 * @param userId - The authenticated user's ID
 * @param data - Card data (front, back)
 * @returns The created card
 * @throws Error if deck not found or user is not the owner
 */
export async function createCardForDeck(
  deckId: number,
  userId: string,
  data: { front: string; back: string }
) {
  // Verify deck ownership
  const deck = await getDeckById(deckId, userId);
  if (!deck) {
    throw new Error("Deck not found or unauthorized");
  }
  
  const [card] = await db
    .insert(cardsTable)
    .values({
      deckId,
      front: data.front,
      back: data.back,
    })
    .returning();
  
  return card;
}

/**
 * Update a card (with user ownership check via deck)
 * @param cardId - The card ID
 * @param userId - The authenticated user's ID
 * @param data - Updated card data (front, back)
 * @returns The updated card
 * @throws Error if card not found or user is not the owner
 */
export async function updateCardForUser(
  cardId: number,
  userId: string,
  data: { front: string; back: string }
) {
  // Verify card belongs to user's deck
  const existing = await getCardById(cardId, userId);
  if (!existing) {
    throw new Error("Card not found or unauthorized");
  }
  
  const [updated] = await db
    .update(cardsTable)
    .set({
      front: data.front,
      back: data.back,
      updatedAt: new Date(),
    })
    .where(eq(cardsTable.id, cardId))
    .returning();
  
  return updated;
}

/**
 * Delete a card (with user ownership check via deck)
 * @param cardId - The card ID
 * @param userId - The authenticated user's ID
 * @throws Error if card not found or user is not the owner
 */
export async function deleteCardForUser(cardId: number, userId: string) {
  // Verify card belongs to user's deck
  const existing = await getCardById(cardId, userId);
  if (!existing) {
    throw new Error("Card not found or unauthorized");
  }
  
  await db.delete(cardsTable).where(eq(cardsTable.id, cardId));
}

/**
 * Delete all cards in a deck (with user ownership check)
 * @param deckId - The deck ID
 * @param userId - The authenticated user's ID
 * @throws Error if deck not found or user is not the owner
 */
export async function deleteAllCardsInDeck(deckId: number, userId: string) {
  // Verify deck ownership
  const deck = await getDeckById(deckId, userId);
  if (!deck) {
    throw new Error("Deck not found or unauthorized");
  }
  
  await db.delete(cardsTable).where(eq(cardsTable.deckId, deckId));
}


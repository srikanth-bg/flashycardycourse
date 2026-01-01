"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createDeckForUser, updateDeckForUser, deleteDeckForUser, getUserDeckCount } from "@/db/queries/deck-queries";

// ============================================
// CREATE DECK
// ============================================

const createDeckSchema = z.object({
  name: z.string().min(1, "Deck name is required").max(255, "Deck name is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
});

type CreateDeckInput = z.infer<typeof createDeckSchema>;

export async function createDeck(input: CreateDeckInput) {
  try {
    // 1. Authenticate
    const { userId, has } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "You must be logged in to create decks",
      };
    }

    // 2. Check deck limit for free users
    const hasUnlimitedDecks = has({ feature: 'unlimited_decks' });
    
    if (!hasUnlimitedDecks) {
      const deckCount = await getUserDeckCount(userId);
      
      if (deckCount >= 3) {
        return {
          success: false,
          error: "Deck limit reached. Upgrade to Pro for unlimited decks.",
        };
      }
    }

    // 3. Validate with Zod
    const validated = createDeckSchema.parse(input);

    // 4. Call mutation function from db/queries
    const deck = await createDeckForUser(userId, {
      name: validated.name,
      description: validated.description,
    });

    // 5. Revalidate affected paths
    revalidatePath("/dashboard");

    return { success: true, data: deck };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    // Handle query function errors
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Handle unexpected errors
    console.error("Unexpected error in createDeck:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

// ============================================
// UPDATE DECK
// ============================================

const updateDeckSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1, "Deck name is required").max(255, "Deck name is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
});

type UpdateDeckInput = z.infer<typeof updateDeckSchema>;

export async function updateDeck(input: UpdateDeckInput) {
  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "You must be logged in to update decks",
      };
    }

    // 2. Validate with Zod
    const validated = updateDeckSchema.parse(input);

    // 3. Call mutation function from db/queries
    const updated = await updateDeckForUser(
      validated.id,
      userId,
      {
        name: validated.name,
        description: validated.description,
      }
    );

    // 4. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath(`/decks/${validated.id}`);

    return { success: true, data: updated };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    // Handle query function errors (ownership, not found, etc.)
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Handle unexpected errors
    console.error("Unexpected error in updateDeck:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

// ============================================
// DELETE DECK
// ============================================

const deleteDeckSchema = z.object({
  id: z.number().positive(),
});

type DeleteDeckInput = z.infer<typeof deleteDeckSchema>;

export async function deleteDeck(input: DeleteDeckInput) {
  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "You must be logged in to delete decks",
      };
    }

    // 2. Validate with Zod
    const validated = deleteDeckSchema.parse(input);

    // 3. Call mutation function from db/queries
    // This will also delete all associated cards due to CASCADE
    await deleteDeckForUser(validated.id, userId);

    // 4. Revalidate affected paths
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    // Handle query function errors (ownership, not found, etc.)
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Handle unexpected errors
    console.error("Unexpected error in deleteDeck:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}


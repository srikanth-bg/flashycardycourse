"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCardForDeck, updateCardForUser, deleteCardForUser } from "@/db/queries/card-queries";

// ============================================
// CREATE CARD
// ============================================

const createCardSchema = z.object({
  deckId: z.number().positive("Deck ID is required"),
  front: z.string().min(1, "Question is required").max(1000, "Question is too long"),
  back: z.string().min(1, "Answer is required").max(1000, "Answer is too long"),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;

export async function createCard(input: CreateCardInput) {
  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "You must be logged in to create cards",
      };
    }

    // 2. Validate with Zod
    const validated = createCardSchema.parse(input);

    // 3. Use mutation function from db/queries
    const card = await createCardForDeck(
      validated.deckId,
      userId,
      { front: validated.front, back: validated.back }
    );

    // 4. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath(`/decks/${validated.deckId}`);

    return { success: true, data: card };
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
    console.error("Unexpected error in createCard:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

// ============================================
// UPDATE CARD
// ============================================

const updateCardSchema = z.object({
  id: z.number().positive("Card ID is required"),
  front: z.string().min(1, "Question is required").max(1000, "Question is too long"),
  back: z.string().min(1, "Answer is required").max(1000, "Answer is too long"),
});

export type UpdateCardInput = z.infer<typeof updateCardSchema>;

export async function updateCard(input: UpdateCardInput) {
  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "You must be logged in to update cards",
      };
    }

    // 2. Validate with Zod
    const validated = updateCardSchema.parse(input);

    // 3. Use mutation function from db/queries
    const updated = await updateCardForUser(
      validated.id,
      userId,
      { front: validated.front, back: validated.back }
    );

    // 4. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath(`/decks/${updated.deckId}`);

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
    console.error("Unexpected error in updateCard:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

// ============================================
// DELETE CARD
// ============================================

const deleteCardSchema = z.object({
  id: z.number().positive("Card ID is required"),
});

export type DeleteCardInput = z.infer<typeof deleteCardSchema>;

export async function deleteCard(input: DeleteCardInput) {
  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "You must be logged in to delete cards",
      };
    }

    // 2. Validate with Zod
    const validated = deleteCardSchema.parse(input);

    // 3. Use mutation function from db/queries
    const deleted = await deleteCardForUser(validated.id, userId);

    // 4. Revalidate affected paths
    revalidatePath("/dashboard");
    revalidatePath(`/decks/${deleted.deckId}`);

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
    console.error("Unexpected error in deleteCard:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}


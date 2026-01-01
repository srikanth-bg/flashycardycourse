"use server";

import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createCardsForDeck } from "@/db/queries/card-queries";
import { getDeckById } from "@/db/queries/deck-queries";

// Input validation schema
const generateCardsSchema = z.object({
  deckId: z.number().positive(),
  count: z.number().min(1).max(20).default(20),
});

// Flashcard output schema - simplified for OpenAI compatibility
const flashcardSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
    })
  ),
});

type GenerateCardsInput = z.infer<typeof generateCardsSchema>;

export async function generateCardsWithAI(input: GenerateCardsInput) {
  try {
    // 1. Authenticate
    const { userId, has } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "You must be logged in to generate flashcards",
      };
    }

    // 2. Check billing access (AI generation is a Pro feature)
    const canUseAI = has({ feature: "ai_flashcard_generation" });
    if (!canUseAI) {
      return {
        success: false,
        error: "AI flashcard generation is only available for Pro subscribers.",
        isPremiumFeature: true,
      };
    }

    // 3. Validate input
    const validated = generateCardsSchema.parse(input);

    // 4. Verify deck ownership
    const deck = await getDeckById(validated.deckId, userId);
    if (!deck) {
      return {
        success: false,
        error: "Deck not found or unauthorized",
      };
    }

    // 5. Check if deck has a description
    if (!deck.description || deck.description.trim() === "") {
      return {
        success: false,
        error: "Please add a description to your deck first. AI needs context to generate relevant flashcards.",
        needsDescription: true,
      };
    }

    // Build the topic from deck name and description
    const topic = `${deck.name}. Context: ${deck.description}`;

    // 6. Generate flashcards with AI
    const { object: output } = await generateObject({
      model: openai("gpt-4o-mini"), // Cost-efficient model
      schema: flashcardSchema,
      prompt: `Generate exactly ${validated.count} flashcards about: ${topic}
      
      Requirements:
      - Create clear, concise questions for the front of each card
      - Provide accurate, helpful answers for the back of each card
      - Focus on key concepts and important details
      - Ensure questions are appropriate for study and memorization
      - Make each flashcard unique and valuable for learning
      - Vary the types of questions (definitions, explanations, applications, etc.)
      - Keep questions focused and answers comprehensive but concise
      
      Return a JSON object with a "cards" array containing objects with "front" and "back" string properties.`,
    });

    // 7. Save generated cards to database
    const createdCards = await createCardsForDeck(
      validated.deckId,
      userId,
      output.cards
    );

    // 8. Revalidate paths
    revalidatePath(`/decks/${validated.deckId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      data: createdCards,
      count: createdCards.length,
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    // Handle AI generation errors
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return {
          success: false,
          error: "AI service is temporarily busy. Please try again in a moment.",
        };
      }

      if (error.message.includes("api key") || error.message.includes("API key")) {
        return {
          success: false,
          error: "AI service configuration error. Please contact support.",
        };
      }

      // Generic error
      console.error("AI generation error:", error);
      return {
        success: false,
        error: error.message || "Failed to generate flashcards. Please try again.",
      };
    }

    // Unexpected errors
    console.error("Unexpected error in generateCardsWithAI:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}


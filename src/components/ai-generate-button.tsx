"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";
import { generateCardsWithAI } from "@/app/actions/ai-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AIGenerateButtonProps {
  deckId: number;
  hasAIFeature: boolean;
  hasDescription: boolean;
}

export function AIGenerateButton({ deckId, hasAIFeature, hasDescription }: AIGenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    if (!hasAIFeature) {
      // Redirect to pricing page for free users
      router.push("/pricing");
      return;
    }

    if (!hasDescription) {
      // Show error if deck doesn't have a description
      toast.error("Please add a description to your deck first. AI needs context to generate relevant flashcards.");
      return;
    }

    setLoading(true);
    try {
      const result = await generateCardsWithAI({ deckId, count: 20 });

      if (result.success) {
        toast.success(`Successfully generated ${result.count} flashcards!`);
      } else {
        if (result.isPremiumFeature) {
          toast.error(result.error);
          router.push("/pricing");
        } else if (result.needsDescription) {
          toast.error(result.error, {
            description: "Click the Edit button to add a description to your deck.",
            duration: 5000,
          });
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      console.error("Failed to generate cards:", error);
      toast.error("Failed to generate flashcards. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Free user - show locked button
  if (!hasAIFeature) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleGenerate}
            variant="outline"
            disabled={loading}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            🔒 Generate Cards with AI (Pro)
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">Premium Feature</p>
          <p className="text-sm">AI flashcard generation is only available for Pro users.</p>
          <p className="text-sm text-muted-foreground mt-1">Click to view pricing and upgrade.</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Pro user but no description - show disabled button with tooltip
  if (!hasDescription) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            <Button
              onClick={handleGenerate}
              variant="outline"
              disabled={true}
              className="pointer-events-none"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              ✨ Generate Cards with AI
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">Description Required</p>
          <p className="text-sm">Please add a description to your deck first.</p>
          <p className="text-sm text-muted-foreground mt-1">AI needs context to generate relevant flashcards.</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Pro user with description - show active button
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleGenerate}
          variant="outline"
          disabled={loading}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "Generating..." : "✨ Generate Cards with AI"}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-sm">
          Generate 20 flashcards automatically using AI based on your deck title and description
        </p>
      </TooltipContent>
    </Tooltip>
  );
}


import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getDeckById, getDeckCards } from "@/db/queries/deck-queries";
import { FlashcardStudy } from "@/components/flashcard-study";
import { Button } from "@/components/ui/button";

interface StudyPageProps {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function StudyPage({ params }: StudyPageProps) {
  // Authenticate user
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }
  
  // Await params (Next.js 15 requirement)
  const { deckId: deckIdParam } = await params;
  const deckId = parseInt(deckIdParam);
  
  // Verify deck exists and is not NaN
  if (isNaN(deckId)) {
    notFound();
  }
  
  // Fetch deck and cards using query functions
  const deck = await getDeckById(deckId, userId);
  
  if (!deck) {
    notFound();
  }
  
  const cards = await getDeckCards(deckId, userId);
  
  // Check if deck has cards
  if (!cards || cards.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back to Deck Link */}
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href={`/decks/${deckId}`}>← Back to Deck</Link>
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">{deck.name}</h1>
            <p className="text-muted-foreground mb-8">
              This deck doesn&apos;t have any cards yet. Add some cards to start studying!
            </p>
            <Button asChild>
              <Link href={`/decks/${deckId}`}>
                Go back to deck
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back to Deck Link */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href={`/decks/${deckId}`}>← Back to Deck</Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{deck.name}</h1>
          {deck.description && (
            <p className="text-muted-foreground">{deck.description}</p>
          )}
        </div>
        
        <FlashcardStudy 
          cards={cards} 
          deckId={deckId}
          deckName={deck.name}
        />
      </div>
    </div>
  );
}


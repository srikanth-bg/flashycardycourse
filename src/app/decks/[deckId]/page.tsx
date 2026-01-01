import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getDeckById, getDeckCards } from "@/db/queries/deck-queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddCardDialog } from "@/components/add-card-dialog";
import { EditDeckDialog } from "@/components/edit-deck-dialog";
import { DeleteDeckDialog } from "@/components/delete-deck-dialog";
import { EditCardDialog } from "@/components/edit-card-dialog";
import { DeleteCardDialog } from "@/components/delete-card-dialog";
import { AIGenerateButton } from "@/components/ai-generate-button";

interface DeckPageProps {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  // Authenticate user
  const { userId, has } = await auth();
  if (!userId) {
    redirect("/");
  }

  // Check if user has AI generation feature
  const hasAIFeature = has({ feature: "ai_flashcard_generation" });

  // Await params (Next.js 15 requirement)
  const { deckId: deckIdParam } = await params;
  const deckId = parseInt(deckIdParam);

  // Validate deckId
  if (isNaN(deckId)) {
    notFound();
  }

  // Fetch deck with ownership verification
  const deck = await getDeckById(deckId, userId);
  if (!deck) {
    notFound();
  }

  // Fetch cards for this deck
  const cards = await getDeckCards(deckId, userId);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back to Dashboard Link */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard">← Back to Dashboard</Link>
        </Button>
      </div>

      {/* Deck Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{deck.name}</h1>
        {deck.description && (
          <p className="text-muted-foreground text-lg">{deck.description}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          <EditDeckDialog 
            deckId={deckId} 
            currentName={deck.name}
            currentDescription={deck.description}
          />
          <DeleteDeckDialog 
            deckId={deckId}
            deckName={deck.name}
            cardCount={cards?.length || 0}
          />
          <AddCardDialog deckId={deckId} />
          <AIGenerateButton 
            deckId={deckId} 
            hasAIFeature={hasAIFeature}
            hasDescription={!!deck.description && deck.description.trim() !== ""}
          />
          <Button variant="outline" asChild>
            <Link href={`/decks/${deckId}/study`}>Study Deck</Link>
          </Button>
        </div>
      </div>

      {/* Cards Display */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">
          Cards ({cards?.length || 0})
        </h2>
      </div>

      {/* Cards Grid */}
      {cards && cards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card key={card.id}>
              <CardHeader>
                <CardTitle className="text-lg">Front</CardTitle>
                <CardDescription className="text-base whitespace-pre-wrap">
                  {card.front}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-2">Back</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {card.back}
                </p>
                <div className="flex gap-2 mt-4">
                  <EditCardDialog 
                    cardId={card.id}
                    currentFront={card.front}
                    currentBack={card.back}
                  />
                  <DeleteCardDialog 
                    cardId={card.id}
                    cardFront={card.front}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              No cards in this deck yet.
            </p>
            <AddCardDialog deckId={deckId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}


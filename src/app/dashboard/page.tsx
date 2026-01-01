import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserDecks, getUserDeckCount } from "@/db/queries/deck-queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateDeckDialog } from "@/components/create-deck-dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId, has } = await auth();

  if (!userId) {
    redirect("/"); // Redirect to homepage where sign-in/sign-up modals are available
  }

  // Check if user has unlimited decks feature (Pro plan)
  const hasUnlimitedDecks = has({ feature: 'unlimited_decks' });
  
  // Fetch user's decks using query function from db/queries
  const decks = await getUserDecks(userId);
  const deckCount = decks.length;
  
  // Determine if user can create more decks
  const canCreateMore = hasUnlimitedDecks || deckCount < 3;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Manage your flashcard decks and study progress
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Your Decks</p>
            <p className="text-2xl font-bold">
              {deckCount}{!hasUnlimitedDecks && '/3'}
            </p>
            {!hasUnlimitedDecks && (
              <Link href="/pricing">
                <Button variant="link" size="sm" className="text-xs">
                  Upgrade for unlimited
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Deck Cards Grid */}
      {decks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {decks.map((deck) => (
            <Link key={deck.id} href={`/decks/${deck.id}`}>
              <Card className="flex flex-col h-full transition-colors hover:bg-accent cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-xl">{deck.name}</CardTitle>
                  <CardDescription className="line-clamp-3 min-h-[3rem]">
                    {deck.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    Updated: {new Date(deck.updatedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {decks.length === 0 && (
        <div className="text-center py-12 mb-8">
          <p className="text-muted-foreground mb-4 text-lg">
            You don&apos;t have any decks yet. Create your first deck to get started!
          </p>
        </div>
      )}

      {/* Create New Deck Dialog or Upgrade Prompt */}
      <div className="flex justify-center">
        {canCreateMore ? (
          <CreateDeckDialog />
        ) : (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Deck Limit Reached</CardTitle>
              <CardDescription>
                You&apos;ve reached the maximum of 3 decks on the free plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Upgrade to Pro to unlock unlimited decks and AI-powered flashcard generation.
              </p>
              <div className="flex gap-4">
                <Link href="/pricing">
                  <Button>Upgrade to Pro</Button>
                </Link>
                <Button variant="outline" disabled>
                  🔒 Create New Deck (Pro Only)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


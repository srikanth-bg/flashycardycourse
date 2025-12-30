import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserDecks } from "@/db/queries/deck-queries";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/"); // Redirect to homepage where sign-in/sign-up modals are available
  }

  // Fetch user's decks using query function from db/queries
  const decks = await getUserDecks(userId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Manage your flashcard decks and study progress
        </p>
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

      {/* Create New Deck Button */}
      <div className="flex justify-center">
        <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
          <Link href="/decks/new">Create New Deck</Link>
        </Button>
      </div>
    </div>
  );
}


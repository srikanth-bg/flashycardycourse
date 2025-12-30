import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthButtons } from "@/components/auth-buttons";

export default async function Home() {
  const { userId } = await auth();
  
  // If user is logged in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background flex items-center justify-center">
      <main className="flex flex-col items-center justify-center px-4 text-center space-y-6">
        <h1 className="text-6xl md:text-7xl font-bold text-foreground">
          FlashyCardy
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground">
          Your personal flashcard platform
        </p>

        <AuthButtons />
      </main>
    </div>
  );
}

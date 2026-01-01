import { PricingTable } from "@clerk/nextjs";

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground">
          Select the perfect plan for your flashcard learning journey
        </p>
      </div>
      
      <div className="flex justify-center">
        <PricingTable />
      </div>
    </div>
  );
}


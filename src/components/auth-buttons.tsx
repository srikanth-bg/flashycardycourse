"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface AuthButtonsProps {
  className?: string;
}

export function AuthButtons({
  className = "flex gap-4 mt-8",
}: AuthButtonsProps) {
  return (
    <div className={className}>
      <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
        <Button size="lg" variant="default">
          Sign In
        </Button>
      </SignInButton>
      
      <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
        <Button size="lg" variant="outline">
          Sign Up
        </Button>
      </SignUpButton>
    </div>
  );
}


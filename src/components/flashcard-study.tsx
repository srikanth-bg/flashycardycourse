"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Keyboard } from "lucide-react";

interface CardData {
  id: number;
  front: string;
  back: string;
  deckId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FlashcardStudyProps {
  cards: CardData[];
  deckId: number;
  deckName: string;
}

export function FlashcardStudy({ cards, deckId, deckName }: FlashcardStudyProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyCards, setStudyCards] = useState(cards);
  const [isShuffled, setIsShuffled] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  // Reset flip state when changing cards
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for arrow keys and spacebar
      if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case "ArrowLeft":
          handlePrevious();
          break;
        case "ArrowRight":
          handleNext();
          break;
        case " ": // Spacebar
          handleFlip();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, isFlipped, studyCards.length]); // Dependencies for the handlers

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...studyCards].sort(() => Math.random() - 0.5);
    setStudyCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(true);
    setCorrectCount(0);
    setIncorrectCount(0);
  };

  const handleRestart = () => {
    setStudyCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(false);
    setCorrectCount(0);
    setIncorrectCount(0);
  };

  const handleCorrect = () => {
    setCorrectCount(correctCount + 1);
    // Auto-advance to next card if not at the end
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleIncorrect = () => {
    setIncorrectCount(incorrectCount + 1);
    // Auto-advance to next card if not at the end
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentCard = studyCards[currentIndex];
  const progress = ((currentIndex + 1) / studyCards.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar and Stats */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            Card {currentIndex + 1} of {studyCards.length}
          </span>
          <div className="flex gap-4 items-center">
            <span className="text-green-500 font-medium">
              ✓ {correctCount} Correct
            </span>
            <span className="text-red-500 font-medium">
              ✗ {incorrectCount} Incorrect
            </span>
            <span className="text-muted-foreground">
              {Math.round(progress)}% complete
            </span>
          </div>
        </div>
        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Keyboard Shortcuts Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg py-2 px-4 border border-border/50">
        <Keyboard className="h-3.5 w-3.5" />
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-background border border-border rounded text-[10px] font-mono">←</kbd>
            <span>Previous</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-background border border-border rounded text-[10px] font-mono">Space</kbd>
            <span>Flip</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 bg-background border border-border rounded text-[10px] font-mono">→</kbd>
            <span>Next</span>
          </span>
        </span>
      </div>

      {/* Flashcard */}
      <div className="relative min-h-[400px] flex items-center justify-center perspective-1000">
        <div
          className={`w-full h-[400px] cursor-pointer transition-transform duration-500 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          onClick={handleFlip}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front of Card */}
          <Card
            className={`absolute inset-0 backface-hidden border-2 hover:border-primary/50 transition-colors ${
              !isFlipped ? "visible" : "invisible"
            }`}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-8">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  Question
                </p>
                <p className="text-2xl font-medium leading-relaxed">
                  {currentCard.front}
                </p>
                <p className="text-sm text-muted-foreground mt-8">
                  Click to reveal answer
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back of Card */}
          <Card
            className={`absolute inset-0 backface-hidden border-2 border-primary ${
              isFlipped ? "visible" : "invisible"
            }`}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-8">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  Answer
                </p>
                <p className="text-2xl font-medium leading-relaxed">
                  {currentCard.back}
                </p>
                <p className="text-sm text-muted-foreground mt-8">
                  Click to see question
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Correct/Incorrect Buttons - Only shown when card is flipped */}
      {isFlipped && (
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={handleIncorrect}
            variant="destructive"
            size="lg"
            className="gap-2 min-w-[140px]"
          >
            ✗ Incorrect
          </Button>
          <Button
            onClick={handleCorrect}
            variant="default"
            size="lg"
            className="gap-2 min-w-[140px] bg-green-600 hover:bg-green-700"
          >
            ✓ Correct
          </Button>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={handleShuffle}
            variant="outline"
            size="lg"
            className="gap-2"
            title="Shuffle cards"
          >
            <Shuffle className="h-5 w-5" />
            Shuffle
          </Button>

          <Button
            onClick={handleRestart}
            variant="outline"
            size="lg"
            className="gap-2"
            title="Restart from beginning"
          >
            <RotateCcw className="h-5 w-5" />
            Restart
          </Button>
        </div>

        <Button
          onClick={handleNext}
          disabled={currentIndex === studyCards.length - 1}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          Next
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Completion Message */}
      {currentIndex === studyCards.length - 1 && isFlipped && (
        <div className="text-center p-6 bg-secondary/50 rounded-lg space-y-4">
          <p className="text-lg font-medium">
            🎉 You&apos;ve reached the last card!
          </p>
          <div className="text-muted-foreground space-y-2">
            <p className="text-xl font-semibold">
              Score: {correctCount} / {studyCards.length}
            </p>
            <p>
              Correct: <span className="text-green-500 font-medium">{correctCount}</span> • 
              Incorrect: <span className="text-red-500 font-medium">{incorrectCount}</span>
              {correctCount + incorrectCount < studyCards.length && (
                <> • Unanswered: {studyCards.length - correctCount - incorrectCount}</>
              )}
            </p>
            <p className="mt-4">
              Great job studying! Click Restart to go through the cards again, or
              Shuffle for a randomized review.
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleRestart} variant="default">
              Restart Deck
            </Button>
            <Button onClick={handleShuffle} variant="outline">
              Shuffle & Restart
            </Button>
            <Button
              onClick={() => window.location.href = `/decks/${deckId}`}
              variant="outline"
            >
              Back to Deck
            </Button>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {isShuffled && (
        <div className="text-center text-sm text-muted-foreground">
          <p>Cards are shuffled • Click Restart to return to original order</p>
        </div>
      )}
    </div>
  );
}


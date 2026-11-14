import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Lock, Gift } from 'lucide-react';
import { useLessonPlanAccess } from '@/hooks/use-lesson-plan-access';

/**
 * Wraps the lesson-plan generator. A teacher with an unused free generation or at least
 * one entitled learning area gets through; everyone else sees the purchase wall.
 */
export default function LessonPlanSubscriptionGate({ user, children }) {
  const { list, isLoading, freeTrialAvailable } = useLessonPlanAccess(user);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (freeTrialAvailable || list.length > 0) return children;

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto py-16 space-y-4">
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Lesson plan access needed</h2>
          <p className="text-sm text-muted-foreground">
            You have used your free lesson-plan generation. Unlock the exact learning area and term you are teaching
            for KSh 100 each.
          </p>
          <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
            <Gift className="w-4 h-4" /> Each learning area and term is purchased separately
          </div>
          <Button asChild className="w-full gap-2">
            <Link to="/lesson-plans/access">
              <BookOpen className="w-4 h-4" /> Buy lesson-plan access
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
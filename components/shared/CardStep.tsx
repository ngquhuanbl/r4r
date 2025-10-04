"use client";

import { CardComponentProps } from "nextstepjs";
import React from "react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

const StepCard = ({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) => {
  return (
    <Card className="w-[80vw] sm:w-[500px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-1 sm:gap-2">
          {step.icon && <span>{step.icon}</span>}
          {step.title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="sm:mb-2 text-sm sm:text-base whitespace-normal">
          {step.content}
        </div>
        {arrow}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-xs sm:text-sm text-muted-foreground">
          {currentStep + 1} / {totalSteps}
        </div>

        <div className="flex gap-1 sm:gap-2">
          {currentStep > 0 && (
            <Button variant="outline" onClick={prevStep}>
              Previous
            </Button>
          )}

          <Button onClick={nextStep}>
            {currentStep === totalSteps - 1 ? "Finish" : "Next"}
          </Button>

          {step.showSkip && (
            <Button variant="ghost" onClick={skipTour}>
              Skip
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default StepCard;

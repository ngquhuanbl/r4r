"use client";

import { ONBOARDING_IMG_SRC } from "@/constants/dashboard/onboarding";
import ReactDOM from "react-dom";

export function PreloadResources() {
  ReactDOM.preload(ONBOARDING_IMG_SRC, { as: "image", fetchPriority: "high" });
  return null;
}

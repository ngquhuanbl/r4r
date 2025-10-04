export const INCOMING_REVIEWS_TAB_ID = "tab__incoming-reviews";
export const OUTGOING_REVIEWS_TAB_ID = "tab__outgoing-reviews";

export const INCOMING_REVIEWS_PANEL_ID = "panel__incoming-reviews";
export const OUTGOING_REVIEWS_PANEL_ID = "panel__outgoing-reviews";

export const REVIEW_CONTENT_LENGTH_LIMIT = 150;

export const REVIEW_STATUS_FILTER_ALL_OPTION = {
  id: -1,
  name: "All review statuses",
};

export const BUSINESS_FILTER_ALL_OPTION = {
  id: -1,
  name: "All businesses",
};

export const INCOMING_REVIEWS_PAGE_SIZE = 5;

export const OUTGOING_REVIEWS_PAGE_SIZE = 5;

export enum ONBOARDING_STEP_IDS {
  NAV_BAR = "nav-bar",
  NOTIFICATIONS = "notifications",
  YOUR_REVIEWS = "your-reviewS",
  INCOMING_REVIEWS = INCOMING_REVIEWS_TAB_ID,
  OUTGOING_REVIEWS = OUTGOING_REVIEWS_TAB_ID,
  YOUR_ACHIEVEMENT = "your-achievement",
  LETS_START = "let-start",
}

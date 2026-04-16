/**
 * Maps Stripe / network errors to short copy for toasts (client or server).
 */
export function stripeErrorToUserMessage(err: unknown): string {
  const raw =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: unknown }).message)
      : err instanceof Error
        ? err.message
        : "";

  const m = raw.toLowerCase();

  if (
    m.includes("no attached payment source") ||
    m.includes("default payment method") ||
    m.includes("please consider adding a default payment method") ||
    m.includes("payment_methods_setting")
  ) {
    return "Add a payment method before upgrading. On the Billing page, click “Change card” to open the secure portal and save a card, then try again.";
  }

  if (
    m.includes("card was declined") ||
    m.includes("your card was declined") ||
    m.includes("insufficient funds")
  ) {
    return "Your card was declined or could not be charged. Update your payment method with “Change card” and try again.";
  }

  if (m.includes("expired card") || m.includes("incorrect_cvc")) {
    return "Your card details need updating. Use “Change card” on the Billing page.";
  }

  if (raw && raw.length > 0 && raw.length < 220) {
    return raw;
  }

  return "Something went wrong while updating billing. Please try again.";
}

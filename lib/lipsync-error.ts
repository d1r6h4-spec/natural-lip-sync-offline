const PROVIDER_CREDIT_MESSAGE =
  "The AI provider (Replicate) reports insufficient credit for running this lip-sync model. Please top up your Replicate credits or wait a few minutes after adding funds before trying again.";

export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function isProviderCreditError(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  return message.includes("402") || message.includes("insufficient credit") || message.includes("insufficient credits");
}

export function friendlyLipSyncError(error: unknown, fallback = "Please check your connection and try again.") {
  const message = errorMessage(error);
  if (isProviderCreditError(error)) return PROVIDER_CREDIT_MESSAGE;
  return message || fallback;
}

export const providerCreditMessage = PROVIDER_CREDIT_MESSAGE;

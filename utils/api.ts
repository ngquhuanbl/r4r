import { APIResponse } from "@/types/shared";

export async function unwrap<Result>(promise: Promise<APIResponse<Result>>) {
  const response = await promise;

  if (response.ok) return response.data;
  throw response.error;
}

export type APIResponse<Result> =
  | {
      ok: true;
      data: Result;
    }
  | {
      ok: false;
      error: any;
    };

export type UserId = string;

export type ActionResponse<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

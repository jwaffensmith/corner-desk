export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const isForced = (query: unknown) =>
  (query as Record<string, unknown>)["force"] === "true";

export function assertRoom(count: number, limit: number, what: string) {
  if (count >= limit) throw new HttpError(409, `You can have at most ${limit} ${what}`);
}

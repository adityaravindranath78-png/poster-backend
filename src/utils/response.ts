import { Response } from "express";

export function ok<T>(res: Response, data: T) {
  return res.json({ success: true, data, error: null });
}

export function paginated<T>(
  res: Response,
  data: T[],
  nextKey?: string,
  total?: number
) {
  return res.json({ success: true, data, nextKey, total });
}

export function fail(res: Response, message: string, status = 400) {
  return res.status(status).json({ success: false, data: null, error: message });
}

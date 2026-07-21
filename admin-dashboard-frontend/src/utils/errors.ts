import { AxiosError } from 'axios';
import type { ApiErrorBody } from '../types';

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.message) return body.message;
    if (body?.errors?.length) return body.errors.join(' ');
  }
  return fallback;
}

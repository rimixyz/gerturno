/**
 * Utility to sanitize objects before writing to Firestore.
 * Firestore throws an error if any field in an object or nested object is `undefined`.
 * This recursive function strips undefined fields and converts undefined in arrays to null (or strips).
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === undefined || obj === null) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

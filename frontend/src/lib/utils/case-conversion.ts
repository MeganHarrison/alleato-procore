/**
 * CASE CONVERSION UTILITIES
 *
 * Convert between camelCase (frontend/JS) and snake_case (database/PostgreSQL)
 * Use these to safely transform data between layers
 */

type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? U extends Uncapitalize<U>
    ? `${Uncapitalize<T>}${CamelToSnakeCase<U>}`
    : `${Uncapitalize<T>}_${CamelToSnakeCase<Uncapitalize<U>>}`
  : S;

export type SnakeCaseToCamelCase<T> = {
  [K in keyof T as SnakeToCamelCase<K & string>]: T[K];
};

export type CamelCaseToSnakeCase<T> = {
  [K in keyof T as CamelToSnakeCase<K & string>]: T[K];
};

/**
 * Convert object keys from snake_case to camelCase
 */
export function snakeToCamel<T extends Record<string, unknown>>(
  obj: T,
): SnakeCaseToCamelCase<T> {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );
      result[camelKey] = obj[key];
    }
  }

  return result as SnakeCaseToCamelCase<T>;
}

/**
 * Convert object keys from camelCase to snake_case
 */
export function camelToSnake<T extends Record<string, unknown>>(
  obj: T,
): CamelCaseToSnakeCase<T> {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`,
      );
      result[snakeKey] = obj[key];
    }
  }

  return result as CamelCaseToSnakeCase<T>;
}

/**
 * Convert array of objects from snake_case to camelCase
 */
export function snakeToCamelArray<T extends Record<string, unknown>>(
  arr: T[],
): SnakeCaseToCamelCase<T>[] {
  return arr.map(snakeToCamel);
}

/**
 * Convert array of objects from camelCase to snake_case
 */
export function camelToSnakeArray<T extends Record<string, unknown>>(
  arr: T[],
): CamelCaseToSnakeCase<T>[] {
  return arr.map(camelToSnake);
}

/**
 * Deep conversion for nested objects (snake_case to camelCase)
 */
export function deepSnakeToCamel<T>(obj: T): unknown {
  if (Array.isArray(obj)) {
    return obj.map(deepSnakeToCamel);
  }

  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
          letter.toUpperCase(),
        );
        result[camelKey] = deepSnakeToCamel(
          (obj as Record<string, unknown>)[key],
        );
      }
    }
    return result;
  }

  return obj;
}

/**
 * Deep conversion for nested objects (camelCase to snake_case)
 */
export function deepCamelToSnake<T>(obj: T): unknown {
  if (Array.isArray(obj)) {
    return obj.map(deepCamelToSnake);
  }

  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const snakeKey = key.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`,
        );
        result[snakeKey] = deepCamelToSnake(
          (obj as Record<string, unknown>)[key],
        );
      }
    }
    return result;
  }

  return obj;
}

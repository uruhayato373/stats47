/* eslint-disable no-console */

type LogObject = Record<string, unknown>;

/**
 * エラーオブジェクトをシリアライズ可能な形式に変換
 */
function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    error: String(error),
  };
}

/**
 * ログオブジェクト内のエラーオブジェクトを再帰的にシリアライズ
 */
function serializeErrorsInObject(obj: LogObject): LogObject {
  const serialized: LogObject = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Error) {
      serialized[key] = serializeError(value);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      serialized[key] = serializeErrorsInObject(value as LogObject);
    } else {
      serialized[key] = value;
    }
  }
  
  return serialized;
}

/**
 * ログレベルの取得
 */
function getLogLevel(): string {
  if (typeof process !== "undefined" && process.env?.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  return "info";
}

/**
 * ログメッセージのフォーマット
 */
function formatLog(
  level: string,
  obj: LogObject | string,
  msg?: string
): string {
  const timestamp = new Date().toISOString();
  const app = "stats47";
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    const timeStr = new Date().toLocaleTimeString("ja-JP");
    const levelStr = level.toUpperCase().padEnd(5);
    
    if (typeof obj === "string") {
      return `[${timeStr}] ${levelStr} ${obj}`;
    }

    const { msg: objMsg, ...rest } = serializeErrorsInObject(obj);
    const displayMsg = msg || (objMsg as string) || "";
    
    // メタデータがある場合のみJSONとして後ろに付ける
    const metadata = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";
    
    return `[${timeStr}] ${levelStr} ${displayMsg}${metadata}`;
  }

  if (typeof obj === "string") {
    return JSON.stringify({
      level,
      time: timestamp,
      app,
      msg: obj,
    });
  }

  const serializedObj = serializeErrorsInObject(obj);

  return JSON.stringify({
    level,
    time: timestamp,
    app,
    ...serializedObj,
    msg: msg || "",
  });
}

/**
 * 汎用ロガー (Server & Client)
 */
export const logger = {
  info: (obj: LogObject | string, msg?: string) => {
    console.log(formatLog("info", obj, msg));
  },
  error: (obj: LogObject | string, msg?: string) => {
    console.error(formatLog("error", obj, msg));
  },
  warn: (obj: LogObject | string, msg?: string) => {
    console.warn(formatLog("warn", obj, msg));
  },
  debug: (obj: LogObject | string, msg?: string) => {
    const logLevel = getLogLevel();
    if (logLevel === "debug" || logLevel === "trace") {
      console.log(formatLog("debug", obj, msg));
    }
  },
};

export type Logger = typeof logger;

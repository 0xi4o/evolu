import {
  Sqlite,
  SqliteRow,
  canUseDom,
  ensureSqliteQuery,
  parseJsonResults,
} from "@evolu/common";
import { Effect, Function, Layer } from "effect";

import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

if (canUseDom)
  // @ts-expect-error Missing types.
  self.sqlite3ApiConfig = {
    debug: Function.constVoid,
    log: Function.constVoid,
    warn: Function.constVoid,
    error: Function.constVoid,
  };

const sqlitePromise = sqlite3InitModule().then((sqlite3) =>
  canUseDom
    ? new sqlite3.oo1.JsStorageDb("local")
    : new sqlite3.oo1.OpfsDb("/evolu/evolu1.db", "c"),
);

const exec: Sqlite["exec"] = (arg) =>
  Effect.gen(function* (_) {
    const sqlite = yield* _(Effect.promise(() => sqlitePromise));
    const sqliteQuery = ensureSqliteQuery(arg);
    const rows = sqlite.exec(sqliteQuery.sql, {
      returnValue: "resultRows",
      rowMode: "object",
      bind: sqliteQuery.parameters,
    }) as SqliteRow[];
    parseJsonResults(rows);
    return { rows, changes: sqlite.changes() };
  });

export const SqliteLive = Layer.succeed(Sqlite, { exec });

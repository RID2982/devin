import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  type QueryCommandInput,
  type ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { documentClient, tableName } from './client';
import type { ColumnDef, IndexDef, TableDef } from './schema';

export type Key = Record<string, string>;
type Item = Record<string, unknown>;

export interface QueryOptions {
  /** Range-key equality, when the index or table has one. */
  rangeKey?: string | number;
  /** false walks the range key backwards — "newest first" for a timestamp key. */
  ascending?: boolean;
  limit?: number;
}

const RESERVED_ALIAS = (i: number) => `#n${i}`;
const VALUE_ALIAS = (i: number) => `:v${i}`;

/**
 * Thin typed wrapper over one DynamoDB table.
 *
 * Its job is to hide the two places DynamoDB differs from the SQL rows the rest
 * of the app was written against:
 *
 *  - **Dates.** Stored as ISO-8601 strings (so they sort lexicographically as
 *    range keys) and handed back as `Date` objects, which is what `pg` returned
 *    and what services like the dashboard do arithmetic on.
 *  - **Absent vs null.** DynamoDB simply omits an attribute; `SELECT *` always
 *    produced the column with a `null`. Reads re-fill every declared column, so
 *    checks like `event.budget === null` still mean what they meant.
 */
export class Table<T extends object = Item> {
  readonly def: TableDef;
  readonly tableName: string;
  private readonly dateColumns: Set<string>;
  private readonly indexKeyColumns: Set<string>;

  constructor(def: TableDef) {
    this.def = def;
    this.tableName = tableName(def.name);
    this.dateColumns = new Set(
      Object.entries(def.columns)
        .filter(([, col]) => col.type === 'date')
        .map(([name]) => name),
    );
    // Key attributes of the table and of every GSI. DynamoDB rejects a write
    // that types one of these NULL, so they get omitted instead.
    this.indexKeyColumns = new Set<string>([def.hashKey]);
    if (def.rangeKey) this.indexKeyColumns.add(def.rangeKey);
    for (const index of def.indexes ?? []) {
      this.indexKeyColumns.add(index.hashKey);
      if (index.rangeKey) this.indexKeyColumns.add(index.rangeKey);
    }
  }

  // -------------------------------------------------------------------------
  // Marshalling
  // -------------------------------------------------------------------------
  private encodeValue(column: string, value: unknown): unknown {
    if (value === undefined || value === null) return undefined;
    if (this.dateColumns.has(column)) {
      return value instanceof Date ? value.toISOString() : new Date(value as string).toISOString();
    }
    return value;
  }

  /** Domain object -> DynamoDB item. Nulls survive except on index keys. */
  private encode(values: Partial<T>): Item {
    const item: Item = {};
    for (const [column, raw] of Object.entries(values)) {
      if (raw === undefined) continue;
      if (raw === null) {
        if (!this.indexKeyColumns.has(column)) item[column] = null;
        continue;
      }
      item[column] = this.encodeValue(column, raw);
    }
    return item;
  }

  /** DynamoDB item -> domain object, with every declared column present. */
  private decode(item: Item | undefined): T | undefined {
    if (!item) return undefined;
    const row: Item = {};
    for (const [column, def] of Object.entries(this.def.columns)) {
      const value = item[column];
      if (value === undefined || value === null) {
        row[column] = null;
        continue;
      }
      row[column] = def.type === 'date' ? new Date(value as string) : value;
    }
    // Anything stored outside the declared column list still comes back, so an
    // import from an older shape is never silently dropped.
    for (const [column, value] of Object.entries(item)) {
      if (!(column in row)) row[column] = value;
    }
    return row as T;
  }

  private applyDefaults(values: Partial<T>): Partial<T> {
    const withDefaults: Item = { ...values };
    for (const [column, def] of Object.entries(this.def.columns) as [string, ColumnDef][]) {
      if (withDefaults[column] !== undefined) continue;
      withDefaults[column] =
        typeof def.default === 'function' ? (def.default as () => unknown)() : (def.default ?? null);
    }
    return withDefaults as Partial<T>;
  }

  /**
   * Defaults + encoding for a raw row, without writing it. Lets bulk loaders
   * (see import-from-postgres.ts) reuse this marshalling inside BatchWriteItem.
   */
  encodeForImport(values: Record<string, unknown>): Record<string, unknown> {
    return this.encode(this.applyDefaults(values as Partial<T>));
  }

  keyOf(item: Partial<T>): Key {
    const source = item as Item;
    const key: Key = { [this.def.hashKey]: source[this.def.hashKey] as string };
    if (this.def.rangeKey) key[this.def.rangeKey] = source[this.def.rangeKey] as string;
    return key;
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------
  /** Full table read, following pagination to the end. */
  async scan(filter?: Partial<ScanCommandInput>): Promise<T[]> {
    const items: Item[] = [];
    let startKey: Record<string, unknown> | undefined;

    do {
      const result = await documentClient.send(
        new ScanCommand({
          TableName: this.tableName,
          ExclusiveStartKey: startKey,
          ...filter,
        }),
      );
      items.push(...((result.Items ?? []) as Item[]));
      startKey = result.LastEvaluatedKey;
    } while (startKey);

    return items.map((item) => this.decode(item)!) as T[];
  }

  /** Alias that reads better at call sites: `db.events.all()`. */
  all(): Promise<T[]> {
    return this.scan();
  }

  async get(key: Key): Promise<T | undefined> {
    const result = await documentClient.send(new GetCommand({ TableName: this.tableName, Key: key }));
    return this.decode(result.Item as Item | undefined);
  }

  /** Convenience for the `id`-keyed tables. */
  getById(id: string): Promise<T | undefined> {
    return this.get({ [this.def.hashKey]: id });
  }

  async getMany(ids: string[]): Promise<T[]> {
    const unique = [...new Set(ids)];
    const rows = (await Promise.all(unique.map((id) => this.getById(id)))) as (T | undefined)[];
    return rows.filter((row): row is T => row !== undefined);
  }

  /** Query the table's own key, e.g. every attendance item for one event. */
  query(hashValue: string, options: QueryOptions = {}): Promise<T[]> {
    return this.runQuery(
      { hashKey: this.def.hashKey, rangeKey: this.def.rangeKey, name: '' },
      hashValue,
      options,
      undefined,
    );
  }

  /** Query a GSI by its logical name (as declared in schema.ts). */
  queryIndex(indexName: string, hashValue: string, options: QueryOptions = {}): Promise<T[]> {
    const index = (this.def.indexes ?? []).find((i) => i.name === indexName);
    if (!index) throw new Error(`Unknown index "${indexName}" on table "${this.def.name}"`);
    return this.runQuery(index, hashValue, options, indexName);
  }

  private async runQuery(
    index: IndexDef,
    hashValue: string,
    options: QueryOptions,
    indexName: string | undefined,
  ): Promise<T[]> {
    const names: Record<string, string> = { '#hk': index.hashKey };
    const values: Record<string, unknown> = { ':hv': hashValue };
    let condition = '#hk = :hv';

    if (options.rangeKey !== undefined && index.rangeKey) {
      names['#rk'] = index.rangeKey;
      values[':rv'] = this.encodeValue(index.rangeKey, options.rangeKey);
      condition += ' AND #rk = :rv';
    }

    const input: QueryCommandInput = {
      TableName: this.tableName,
      ...(indexName ? { IndexName: indexName } : {}),
      KeyConditionExpression: condition,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ...(options.ascending === false ? { ScanIndexForward: false } : {}),
      ...(options.limit ? { Limit: options.limit } : {}),
    };

    const items: Item[] = [];
    let startKey: Record<string, unknown> | undefined;

    do {
      const result = await documentClient.send(new QueryCommand({ ...input, ExclusiveStartKey: startKey }));
      items.push(...((result.Items ?? []) as Item[]));
      startKey = result.LastEvaluatedKey;
      if (options.limit && items.length >= options.limit) break;
    } while (startKey);

    const rows = items.map((item) => this.decode(item)!) as T[];
    return options.limit ? rows.slice(0, options.limit) : rows;
  }

  // -------------------------------------------------------------------------
  // Writes
  // -------------------------------------------------------------------------
  /** Insert with defaults applied (generated id, timestamps, column defaults). */
  async create(values: Partial<T>): Promise<T> {
    const row = this.applyDefaults(values);
    await documentClient.send(new PutCommand({ TableName: this.tableName, Item: this.encode(row) }));
    return this.decode(this.encode(row))!;
  }

  async createMany(rows: Partial<T>[]): Promise<T[]> {
    return Promise.all(rows.map((row) => this.create(row)));
  }

  /** Unconditional overwrite of a whole item. */
  async put(values: Partial<T>): Promise<T> {
    const row = this.applyDefaults(values);
    await documentClient.send(new PutCommand({ TableName: this.tableName, Item: this.encode(row) }));
    return this.decode(this.encode(row))!;
  }

  /**
   * Insert unless the key is already taken — the DynamoDB spelling of
   * `ON CONFLICT DO NOTHING`. Returns false when an item was already there.
   */
  async createIfNotExists(values: Partial<T>): Promise<boolean> {
    const row = this.applyDefaults(values);
    try {
      await documentClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: this.encode(row),
          ConditionExpression: 'attribute_not_exists(#hk)',
          ExpressionAttributeNames: { '#hk': this.def.hashKey },
        }),
      );
      return true;
    } catch (err) {
      if ((err as { name?: string }).name === 'ConditionalCheckFailedException') return false;
      throw err;
    }
  }

  /**
   * Partial update of an existing item. `undefined` values are skipped (as
   * Drizzle's `.set()` did); an explicit `null` clears the attribute.
   *
   * Returns undefined when no such item exists. UpdateItem would otherwise
   * *insert* a half-built item from the key plus whatever was being set, where
   * `UPDATE ... WHERE id = ?` simply matched nothing — so the condition below
   * keeps the SQL behaviour the callers were written against. Use `upsert` when
   * an insert is what you actually want.
   */
  async update(key: Key, values: Partial<T>): Promise<T | undefined> {
    const setPairs: string[] = [];
    const removals: string[] = [];
    const names: Record<string, string> = {};
    const attrValues: Record<string, unknown> = {};
    let i = 0;

    for (const [column, raw] of Object.entries(values)) {
      if (raw === undefined) continue;
      if (column in key) continue; // key attributes can't be updated
      const nameAlias = RESERVED_ALIAS(i);
      names[nameAlias] = column;

      if (raw === null && this.indexKeyColumns.has(column)) {
        removals.push(nameAlias);
      } else {
        const valueAlias = VALUE_ALIAS(i);
        attrValues[valueAlias] = raw === null ? null : this.encodeValue(column, raw);
        setPairs.push(`${nameAlias} = ${valueAlias}`);
      }
      i += 1;
    }

    if (!setPairs.length && !removals.length) return this.get(key);

    const expression = [
      setPairs.length ? `SET ${setPairs.join(', ')}` : '',
      removals.length ? `REMOVE ${removals.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    names['#pk'] = this.def.hashKey;

    try {
      const result = await documentClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: key,
          UpdateExpression: expression,
          ConditionExpression: 'attribute_exists(#pk)',
          ExpressionAttributeNames: names,
          ...(Object.keys(attrValues).length ? { ExpressionAttributeValues: attrValues } : {}),
          ReturnValues: 'ALL_NEW',
        }),
      );

      return this.decode(result.Attributes as Item | undefined);
    } catch (err) {
      if ((err as { name?: string }).name === 'ConditionalCheckFailedException') return undefined;
      throw err;
    }
  }

  /** Update by primary key for the `id`-keyed tables. */
  updateById(id: string, values: Partial<T>): Promise<T | undefined> {
    return this.update({ [this.def.hashKey]: id }, values);
  }

  /**
   * Insert or merge onto an existing item — the equivalent of
   * `ON CONFLICT ... DO UPDATE`. Defaults only apply to the insert branch.
   */
  async upsert(values: Partial<T>): Promise<T> {
    const key = this.keyOf(values);
    const existing = await this.get(key);
    if (!existing) return this.create(values);
    return (await this.update(key, values)) as T;
  }

  async delete(key: Key): Promise<void> {
    await documentClient.send(new DeleteCommand({ TableName: this.tableName, Key: key }));
  }

  deleteById(id: string): Promise<void> {
    return this.delete({ [this.def.hashKey]: id });
  }

  async deleteMany(keys: Key[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)));
  }
}

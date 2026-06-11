import { IGunChainReference } from "./gun/types/chain";
import {
    Filter,
    rangeWithFilter,
    filteredIndexRange,
} from "./filter";

const WAIT_DEFAULT = 99;
const ASC_ORDER = 1;
const DES_ORDER = -1;

export interface IterateOptions<T=string> extends Filter<T> {
    /**
     * Possible values:
     * 1. Positive number: Ascending order.
     * 2. Negative number: Desccending order.
     * 3. Zero or undefined: Defaults to ascending order when
     * ordering is guaranteed, otherwise order is not defined.
     */
    order?: number;
    /**
     * **Temporarily ignored. Do not use.**
     * 
     * After this time interval (ms), no more
     * data is returned. Defaults to Gun's default
     * of 99 ms.
     **/
    wait?: number;
}

/**
 * Iterate over async iterator to the end and return
 * the collected values.
 * @param it An async iterable
 */
export async function iterateAll<T>(it: AsyncIterable<T>): Promise<T[]> {
    let values: T[] = [];
    for await (let value of it) {
        values.push(value);
    }
    return values;
}

/**
 * Iterates over the inner keys of a record at a Gun node reference
 * by loading the whole record and iterating in sorted order.
 *
 * Note that keys are guaranteed to be in sorted order, but if a peer
 * fails to reply within the `wait` period, the item [value, key] will be
 * skipped. A second pass is necessary to get these skipped items.
 *
 * Filtering using [Gun's lexical wire spec](https://gun.eco/docs/RAD#lex)
 * is **not** supported (as at Gun v0.2020.520). Use {@link scanRecord}
 * instead, if you need to filter in this way.
 *
 * @param ref Gun node reference
 **/
export function iterateRecord<V = any, T = Record<any, V>>(
    ref: IGunChainReference<T>,
    opts: IterateOptions = {},
): AsyncGenerator<[V, string]> {
    if (!ref) {
        throw new Error('Invalid Gun node reference');
    }
    return _iterateSortedRecord(ref, opts);
}

/**
 * Iterates over the inner keys of a record at a Gun node reference,
 * by loading the whole record.
 * 
 * Note that keys are guaranteed to be in order, but if a peer
 * fails to reply within the `wait` period, the item [value, key] will
 * skipped. A second pass is necessary to get these skipped items.
 * 
 * Filtering using [Gun's lexical wire spec](https://gun.eco/docs/RAD#lex)
 * is **not** supported (as at Gun v0.2020.520). Use {@link scanRecord}
 * instead, if you need to filter in this way.
 * 
 * @param ref Gun node reference
 **/
async function * _iterateSortedRecord<V = any, T = Record<any, V>>(
    ref: IGunChainReference<T>,
    opts: IterateOptions,
): AsyncGenerator<[V, string]> {
    let {
        wait = WAIT_DEFAULT,
    } = opts;
    let order = opts.order || ASC_ORDER;

    let range = rangeWithFilter(opts);
    if (isValueRangeEmpty(range)) {
        return;
    }

    // Get list of keys
    let obj: any = await ref.then!();
    if (typeof obj === 'undefined' || obj === null) {
        return;
    }
    if (typeof obj !== 'object') {
        throw new Error(`Cannot iterate keys of non-object record "${obj}" at key "${(ref as any)._?.get}"`);
    }
    // Remove meta
    const { _: _meta, ...rest } = obj;
    obj = rest;
    let keys = Object.keys(obj).sort();

    // Find iteration bounds
    let [iStart, iEnd] = filteredIndexRange(keys, range);
    if (iStart >= iEnd) {
        return;
    }

    // Iterate
    let key: string;
    if (order >= 0) {
        // Natural direction
        for (let i = iStart; i < iEnd; i++) {
            key = keys[i];
            yield [obj[key], key];
        }
    } else {
        // Reverse direction
        for (let i = iEnd - 1; i >= iStart; i--) {
            key = keys[i];
            yield [obj[key], key];
        }
    }
}

/**
 * Iterate over inner references at a Gun node reference, yielding
 * the inner reference and its key.
 * 
 * Note that keys are not guaranteed to be in order if there
 * is more than one connected peer.
 * 
 * @param ref Gun node reference
 **/
export async function* iterateRefs<T = any>(
    ref: IGunChainReference<T[] | Record<any, T>>,
    opts?: IterateOptions,
): AsyncGenerator<[IGunChainReference<T>, string]> {
    let innerRef: IGunChainReference<T>;
    for await (let [val, key] of iterateRecord(ref, opts)) {
        innerRef = ref.get(key as any);
        yield [innerRef, key];
    }
}

/**
 * Iterate over inner records at a Gun node reference, yielding
 * the inner record and its key.
 * 
 * Note that keys are not guaranteed to be in order if there
 * is more than one connected peer.
 * 
 * @param ref Gun node reference
 **/
export async function* iterateItems<T = any>(
    ref: IGunChainReference<T[] | Record<any, T>>,
    opts?: IterateOptions,
): AsyncGenerator<[T, string]> {
    for await (let [val, key] of iterateRecord(ref, opts)) {
        if (typeof val === 'object') {
            val = await ref.get(key as any).then!();
        }
        yield [val, key];
    }
}

/**
 * Iterate over inner records at a Gun node reference, yielding
 * the inner record.
 * 
 * Note that keys are not guaranteed to be in order if there
 * is more than one connected peer.
 * 
 * @param ref Gun node reference
 **/
export async function* iterateValues<T = any>(
    ref: IGunChainReference<T[] | Record<any, T>>,
    opts?: IterateOptions,
): AsyncGenerator<T> {
    for await (let [v] of iterateItems(ref, opts)) {
        yield v;
    }
}

/**
 * Iterate over inner records at a Gun node reference, yielding
 * the inner record.
 * 
 * Note that keys are not guaranteed to be in order if there
 * is more than one connected peer.
 * 
 * @param ref Gun node reference
 **/
export async function* iterateKeys(
    ref: IGunChainReference,
    opts?: IterateOptions,
): AsyncGenerator<string> {
    for await (let [v, k] of iterateRecord(ref, opts)) {
        yield k;
    }
}

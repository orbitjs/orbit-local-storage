import Orbit from 'orbit';
import Source from 'orbit/source';
import Pullable from 'orbit/interfaces/pullable';
import Pushable from 'orbit/interfaces/pushable';
import Syncable from 'orbit/interfaces/syncable';
import { assert } from 'orbit/lib/assert';
import TransformOperators from './lib/transform-operators';
import { QueryOperators } from './lib/queries';
import { supportsLocalStorage } from './lib/local-storage';

/**
 * Source for storing data in localStorage.
 *
 * @class LocalStorageSource
 * @extends Source
 */
export default class LocalStorageSource extends Source {
  /**
   * Create a new LocalStorageSource.
   *
   * @constructor
   * @param {Object} [options]           Options.
   * @param {Schema} [options.schema]    Schema for source.
   * @param {String} [options.namespace] Optional. Prefix for keys used in localStorage. Defaults to 'orbit'.
   * @param {String} [options.delimiter] Optional. Delimiter used to separate key segments in localStorage. Defaults to '/'.
   */
  constructor(options = {}) {
    assert('LocalStorageSource\'s `schema` must be specified in `options.schema` constructor argument', options.schema);
    assert('Your browser does not support local storage!', supportsLocalStorage());

    options.name = options.name || 'localStorage';

    super(options);

    this.namespace = options.namespace || 'orbit';
    this.delimiter = options.delimiter || '/';
  }

  getKeyForRecord(record) {
    return [this.namespace, record.type, record.id].join(this.delimiter);
  }

  getRecord(record) {
    const key = this.getKeyForRecord(record);

    return JSON.parse(self.localStorage.getItem(key));
  }

  putRecord(record) {
    const key = this.getKeyForRecord(record);

    // console.log('LocalStorageSource#putRecord', key, JSON.stringify(record));

    self.localStorage.setItem(key, JSON.stringify(record));
  }

  removeRecord(record) {
    const key = this.getKeyForRecord(record);

    // console.log('LocalStorageSource#removeRecord', key, JSON.stringify(record));

    self.localStorage.removeItem(key);
  }

  reset() {
    for (let key in self.localStorage) {
      if (key.indexOf(this.namespace) === 0) {
        self.localStorage.removeItem(key);
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Syncable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _sync(transform) {
    this._applyTransform(transform);
    return Orbit.Promise.resolve();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _push(transform) {
    this._applyTransform(transform);
    return Orbit.Promise.resolve([transform]);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable implementation
  /////////////////////////////////////////////////////////////////////////////

  _pull(query) {
    const transforms = QueryOperators[query.expression.op](this, query.expression);

    return Orbit.Promise.resolve(transforms);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Private
  /////////////////////////////////////////////////////////////////////////////

  _applyTransform(transform) {
    transform.operations.forEach(operation => {
      TransformOperators[operation.op](this, operation);
    });
  }
}

Pullable.extend(LocalStorageSource.prototype);
Pushable.extend(LocalStorageSource.prototype);
Syncable.extend(LocalStorageSource.prototype);

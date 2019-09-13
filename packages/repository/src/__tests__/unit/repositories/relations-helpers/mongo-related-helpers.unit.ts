// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository-tests
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect} from '@loopback/testlab';
import {ObjectID} from 'bson';
import {belongsTo, Entity, hasMany, model, property} from '../../../..';
import {
  isBsonType,
  deduplicate,
  normalizeKey,
  buildLookupMap,
  reduceAsArray,
} from '../../../../relations';

describe('unit tests, simulates mongodb env for helpers of ininclusion resolver ', () => {
  describe('helpers for formating instances', async () => {
    it('isBsonType', async () => {
      const id1 = new ObjectID();
      const id2 = new ObjectID();
      expect(isBsonType(id1)).to.be.true();
      expect(isBsonType(id2)).to.be.true();
    });
    it('simple deduplcate + isBsonType', async () => {
      const id1 = new ObjectID();
      const id2 = new ObjectID();

      const result = deduplicate([id1, id2]);

      expect(result).to.deepEqual([id1, id2]);
    });
    it('multiple items deduplcate + isBsonType', async () => {
      const id1 = new ObjectID();
      const id2 = new ObjectID();
      const id3 = new ObjectID();
      expect(isBsonType(id1)).to.be.true();

      const result = deduplicate([id3, id1, id1, id3, id2]);

      expect(result).to.deepEqual([id3, id1, id2]);
    });
  });

  describe('helpers for generating inclusion resolvers', async () => {
    it('normalizeKey', async () => {
      const id = new ObjectID();
      expect(normalizeKey(id)).to.eql(id.toHexString());
    });
    // the tests below simulate mongodb environment.
    it('simple normalizeKey + buildLookupMap', async () => {
      const id = new ObjectID();
      expect(normalizeKey(id)).to.eql(id.toHexString());
    });
    it('normalizeKey + buildLookupMap: returns multiple instances in an array', async () => {
      const categoryId = new ObjectID();
      const anotherCategoryId = new ObjectID();
      const pen = createPen(categoryId);
      const pencil = createPencil(categoryId);
      createPEraser(anotherCategoryId);

      const result = buildLookupMap<unknown, Product, Category[]>(
        [pen, pencil],
        'categoryId',
        reduceAsArray,
      );
      // expects this map to have String/Product pair
      const expected = new Map<String, Array<Product>>();
      const strId = categoryId.toString();
      expected.set(strId, [pen, pencil]);
      expect(result).to.eql(expected);
    });
    it('normalizeKey + buildLookupMap: return instances in multiple arrays', async () => {
      const categoryId = new ObjectID();
      const anotherCategoryId = new ObjectID();
      const pen = createPen(categoryId);
      const pencil = createPencil(categoryId);
      const eraser = createPEraser(anotherCategoryId);

      const result = buildLookupMap<unknown, Product, Category[]>(
        [pen, eraser, pencil],
        'categoryId',
        reduceAsArray,
      );
      // expects this map to have String/Product pair
      const expected = new Map<String, Array<Product>>();
      const strId1 = categoryId.toString();
      const strId2 = anotherCategoryId.toString();
      expected.set(strId1, [pen, pencil]);
      expected.set(strId2, [eraser]);
      expect(result).to.eql(expected);
    });
  });

  //** helpers
  @model()
  class Product extends Entity {
    // uses unknown for id type in this test to get rid of type error:
    // 'objectId' is not compatable to 'string'
    @property({id: true})
    id: unknown;
    @property()
    name: string;
    @belongsTo(() => Category)
    categoryId: unknown;
  }

  @model()
  class Category extends Entity {
    @property({id: true})
    id?: unknown;
    @property()
    name: string;
    @hasMany(() => Product, {keyTo: 'categoryId'})
    products?: Product[];
  }
  interface CategoryRelations {
    products?: Product[];
  }

  function createPen(cid: unknown) {
    const pen = new Product();
    pen.name = 'pen';
    pen.categoryId = cid;
    return pen;
  }
  function createPencil(cid: unknown) {
    const pencil = new Product();
    pencil.name = 'pencil';
    pencil.categoryId = cid;
    return pencil;
  }
  function createPEraser(cid: unknown) {
    const eraser = new Product();
    eraser.name = 'pencil';
    eraser.categoryId = cid;
    return eraser;
  }
});

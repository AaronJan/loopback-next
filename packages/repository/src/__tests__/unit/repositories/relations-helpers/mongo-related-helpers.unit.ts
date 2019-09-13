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

describe('unit tests, simulates mongodb env for helpers of inclusion resolver ', () => {
  describe('helpers for formating instances', () => {
    it('isBsonType', () => {
      const id = new ObjectID();
      expect(isBsonType(id)).to.be.true();
    });

    it('isBsonType', () => {
      const id = 1;
      expect(isBsonType(id)).to.be.false();
    });

    context('deduplicate + isBsonType', () => {
      it('passes in a  simple unique array', () => {
        const id1 = new ObjectID();
        const id2 = new ObjectID();

        const result = deduplicate([id1, id2]);
        expect(result).to.deepEqual([id1, id2]);
      });

      it('passes in a multiple items array', () => {
        const id1 = new ObjectID();
        const id2 = new ObjectID();
        const id3 = new ObjectID();

        const result = deduplicate([id3, id1, id1, id3, id2]);
        expect(result).to.deepEqual([id3, id1, id2]);
      });
    });
  });

  describe('helpers for generating inclusion resolvers', () => {
    // the tests below simulate mongodb environment.
    context('normalizeKey + buildLookupMap', () => {
      it('checks if id has been normalized', async () => {
        const id = new ObjectID();
        expect(normalizeKey(id)).to.eql(id.toString());
      });

      it('creates a lookup map with a single key', () => {
        const categoryId = new ObjectID();
        const anotherCategoryId = new ObjectID();
        const pen = createPen({categoryId: categoryId});
        const pencil = createPencil({categoryId: categoryId});

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

      it('creates a lookup map with more than one keys', () => {
        const categoryId = new ObjectID();
        const anotherCategoryId = new ObjectID();
        const pen = createPen({categoryId: categoryId});
        const pencil = createPencil({categoryId: categoryId});
        const eraser = createEraser({categoryId: anotherCategoryId});

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
  });

  //** helpers
  @model()
  class Product extends Entity {
    // uses unknown for id type in this test to get rid of type error:
    // type 'ObjectId' is not assignable to parameter of type 'string'.
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

  function createPen(properties: Partial<Product>) {
    return new Product({
      name: 'pen',
      categoryId: properties.categoryId,
    } as Product);
  }
  function createPencil(properties: Partial<Product>) {
    return new Product({
      name: 'pencil',
      categoryId: properties.categoryId,
    } as Product);
  }
  function createEraser(properties: Partial<Product>) {
    return new Product({
      name: 'eraser',
      categoryId: properties.categoryId,
    } as Product);
  }
});

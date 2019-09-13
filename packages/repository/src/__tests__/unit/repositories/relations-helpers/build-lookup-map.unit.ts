// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect} from '@loopback/testlab';
import {buildLookupMap, reduceAsArray, reduceAsSingleItem} from '../../../..';
import {Category, Product} from './relations-helpers-fixtures';

describe('buildLookupMap', () => {
  describe('get the result of using reduceAsArray strategy for hasMany relation', async () => {
    it('returns multiple instances in an array', async () => {
      const pen = createPen(1);
      const pencil = createPencil(1);

      const result = buildLookupMap<unknown, Product, Category[]>(
        [pen, pencil],
        'categoryId',
        reduceAsArray,
      );
      const expected = new Map<Number, Array<Product>>();
      expected.set(1, [pen, pencil]);
      expect(result).to.eql(expected);
    });

    it('return instances in multiple arrays', async () => {
      const pen = createPen(1);
      const pencil = createPencil(1);
      const eraser = createPEraser(2);
      // 'id' is the foreign key in Category in respect to Product when we talk about belongsTo
      const result = buildLookupMap<unknown, Product, Category[]>(
        [pen, eraser, pencil],
        'categoryId',
        reduceAsArray,
      );
      const expected = new Map<Number, Array<Product>>();
      expected.set(1, [pen, pencil]);
      expected.set(2, [eraser]);
      expect(result).to.eql(expected);
    });
  });

  describe('get the result of using reduceAsSingleItem strategy for belongsTo relation', async () => {
    it('returns one instance when one target instance is passed in', async () => {
      const cat = createStationery(1);

      const result = buildLookupMap<unknown, Category>(
        [cat],
        'id',
        reduceAsSingleItem,
      );
      const expected = new Map<Number, Category>();
      expected.set(1, cat);
      expect(result).to.eql(expected);
    });

    it('returns multiple instances when multiple target instances are passed in', async () => {
      const cat1 = createBook(1);
      const cat2 = createBook(2);

      // 'id' is the foreign key in Category in respect to Product when we talk about belongsTo
      const result = buildLookupMap<unknown, Category>(
        [cat1, cat2],
        'id',
        reduceAsSingleItem,
      );
      const expected = new Map<Number, Category>();
      expected.set(1, cat1);
      expected.set(2, cat2);
      expect(result).to.eql(expected);
    });
  });

  //** helpers
  function createStationery(id: number) {
    const pen = new Category();
    pen.name = 'stationery';
    pen.id = id;
    return pen;
  }
  function createBook(id: number) {
    const pen = new Category();
    pen.name = 'book';
    pen.id = id;
    return pen;
  }
  function createPen(cid: number) {
    const pen = new Product();
    pen.name = 'pen';
    pen.categoryId = cid;
    return pen;
  }
  function createPencil(cid: number) {
    const pencil = new Product();
    pencil.name = 'pencil';
    pencil.categoryId = cid;
    return pencil;
  }
  function createPEraser(cid: number) {
    const eraser = new Product();
    eraser.name = 'pencil';
    eraser.categoryId = cid;
    return eraser;
  }
});

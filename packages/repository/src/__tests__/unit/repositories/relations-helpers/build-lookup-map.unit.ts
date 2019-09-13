// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect} from '@loopback/testlab';
import {buildLookupMap, reduceAsArray, reduceAsSingleItem} from '../../../..';
import {
  Category,
  CategoryRepository,
  Product,
  ProductRepository,
  testdb,
} from './relations-helpers-fixtures';

describe('buildLookupMap', () => {
  let productRepo: ProductRepository;
  let categoryRepo: CategoryRepository;

  before(() => {
    productRepo = new ProductRepository(testdb);
    categoryRepo = new CategoryRepository(testdb, async () => productRepo);
  });

  beforeEach(async () => {
    await productRepo.deleteAll();
    await categoryRepo.deleteAll();
  });

  describe('get the result of using reduceAsArray strategy for hasMany relation', async () => {
    it('returns multiple instances in an array', async () => {
      const pen = await productRepo.create({name: 'pen', categoryId: 1});
      const pencil = await productRepo.create({
        name: 'pencil',
        categoryId: 1,
      });
      await productRepo.create({name: 'eraser', categoryId: 2});

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
      const pen = await productRepo.create({name: 'pen', categoryId: 1});
      const pencil = await productRepo.create({
        name: 'pencil',
        categoryId: 1,
      });
      const eraser = await productRepo.create({name: 'eraser', categoryId: 2});

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
      const cat = await categoryRepo.create({id: 1, name: 'angus'});
      await productRepo.create({name: 'pen', categoryId: 1});
      //const pencils = await productRepo.create({name: 'pencils', categoryId: 1});
      await productRepo.create({name: 'eraser', categoryId: 2});
      // 'id' is the foreign key in Category in respect to Product when we talk about belongsTo

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
      const cat1 = await categoryRepo.create({id: 1, name: 'Angus'});
      const cat2 = await categoryRepo.create({id: 2, name: 'Nola'});
      await productRepo.create({name: 'pen', categoryId: 1});
      await productRepo.create({name: 'pencil', categoryId: 1});
      await productRepo.create({name: 'eraser', categoryId: 2});
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
});

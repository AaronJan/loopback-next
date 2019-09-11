// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect} from '@loopback/testlab';
import {findByForeignKeys, flattenTargetsOfOneToOneRelation} from '../../../..';
import {
  CategoryRepository,
  ProductRepository,
  ManufacturerRepository,
  testdb,
} from './relations-helpers-fixtures';

describe('flattenTargetsOfOneToOneRelation', () => {
  let productRepo: ProductRepository;
  let categoryRepo: CategoryRepository;
  let manufacturerRepo: ManufacturerRepository;

  before(() => {
    manufacturerRepo = new ManufacturerRepository(testdb);
    productRepo = new ProductRepository(
      testdb,
      async () => categoryRepo,
      async () => manufacturerRepo,
    );
    categoryRepo = new CategoryRepository(testdb, async () => productRepo);
  });

  beforeEach(async () => {
    await productRepo.deleteAll();
    await categoryRepo.deleteAll();
  });
  describe('get the result of using reduceAsSingleItem strategy for belongsTo relation', async () => {
    it('get the result of single sourceId', async () => {
      const stationery = await categoryRepo.create({name: 'stationery'});
      const pens = await productRepo.create({
        name: 'pens',
        categoryId: stationery.id,
      });
      const anotherCategory = await categoryRepo.create({name: 'books'});
      await productRepo.create({
        name: 'eraser',
        categoryId: anotherCategory.id,
      });

      const targetsFound = await findByForeignKeys(
        categoryRepo,
        'id',
        pens.categoryId,
      );

      const result = flattenTargetsOfOneToOneRelation(
        [pens.categoryId],
        targetsFound,
        'id',
      );
      expect(result).to.eql([stationery]);
    });
    it('get the result of multiple sourceIds', async () => {
      const staionery = await categoryRepo.create({name: 'stationery'});
      const books = await categoryRepo.create({name: 'books'});
      const pens = await productRepo.create({
        name: 'pens',
        categoryId: staionery.id,
      });
      const pencils = await productRepo.create({
        name: 'pencils',
        categoryId: staionery.id,
      });
      const erasers = await productRepo.create({
        name: 'eraser',
        categoryId: books.id,
      });
      // the order of sourceIds matters
      const targetsFound = await findByForeignKeys(categoryRepo, 'id', [
        erasers.categoryId,
        pencils.categoryId,
        pens.categoryId,
      ]);
      const result = flattenTargetsOfOneToOneRelation(
        [erasers.categoryId, pencils.categoryId, pens.categoryId],
        targetsFound,
        'id',
      );
      expect(result).to.deepEqual([books, staionery, staionery]);
    });
  });

  describe('get the result of using reduceAsSingleItem strategy for hasOne relation', async () => {
    it('get the result of single sourceId', async () => {
      const pens = await productRepo.create({name: 'pens'});
      const penMaker = await manufacturerRepo.create({
        name: 'Mr. Plastic',
        productId: pens.id,
      });

      const targetsFound = await findByForeignKeys(
        manufacturerRepo,
        'productId',
        pens.id,
      );

      const result = flattenTargetsOfOneToOneRelation(
        [pens.id],
        targetsFound,
        'productId',
      );
      expect(result).to.eql([penMaker]);
    });
    it('get the result of multiple sourceIds', async () => {
      const pens = await productRepo.create({name: 'pens'});
      const pencils = await productRepo.create({name: 'pencils'});
      const erasers = await productRepo.create({name: 'eraser'});
      const penMaker = await manufacturerRepo.create({
        name: 'Mr. Plastic',
        productId: pens.id,
      });
      const pencilMaker = await manufacturerRepo.create({
        name: 'Mr. Tree',
        productId: pencils.id,
      });
      const eraserMaker = await manufacturerRepo.create({
        name: 'Mr. Rubber',
        productId: erasers.id,
      });
      // the order of sourceIds matters
      const targetsFound = await findByForeignKeys(
        manufacturerRepo,
        'productId',
        [erasers.id, pencils.id, pens.id],
      );
      const result = flattenTargetsOfOneToOneRelation(
        [erasers.id, pencils.id, pens.id],
        targetsFound,
        'productId',
      );
      expect(result).to.deepEqual([eraserMaker, pencilMaker, penMaker]);
    });
  });
});

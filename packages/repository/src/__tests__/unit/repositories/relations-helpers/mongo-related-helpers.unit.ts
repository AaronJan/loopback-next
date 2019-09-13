// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository-tests
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect, toJSON} from '@loopback/testlab';
import {ObjectID} from 'bson';
import {} from 'bson';
import {testdb} from './relations-helpers-fixtures';
import {
  belongsTo,
  BelongsToAccessor,
  DefaultCrudRepository,
  Entity,
  Getter,
  hasMany,
  HasManyRepositoryFactory,
  juggler,
  model,
  property,
} from '../../../..';
import {
  isBsonType,
  deduplicate,
  normalizeKey,
  buildLookupMap,
  reduceAsArray,
} from '../../../../relations';

describe('unit tests, simulates mongodb env fßßor helpers of ininclusion resolver ', () => {
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

  describe('helpers for formating instances', async () => {
    it('isBsinType', async () => {
      const id1 = new ObjectID();
      const id2 = new ObjectID();
      expect(isBsonType(id1)).to.be.true();
      expect(isBsonType(id2)).to.be.true();
    });
    it('simple deduplcate + isBsonType', async () => {
      const id1 = new ObjectID();
      const id2 = new ObjectID();

      const result = deduplicate([id1, id2]);

      expect(result).to.deepEqual(toJSON([id1, id2]));
      expect(typeof result[0] === 'string').to.be.true();
      expect(typeof result[1] === 'string').to.be.true();
    });
    it('multiple items deduplcate + isBsonType', async () => {
      const id1 = new ObjectID();
      const id2 = new ObjectID();
      const id3 = new ObjectID();
      expect(isBsonType(id1)).to.be.true();

      const result = deduplicate([id3, id1, id1, id3, id2]);

      expect(result).to.deepEqual(toJSON([id3, id1, id2]));
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
      const anotherCatId = new ObjectID();
      const pen = await categoryRepo.products(categoryId).create({
        name: 'pen',
      });
      const pencil = await categoryRepo.products(categoryId).create({
        name: 'pencil',
      });
      await productRepo.create({name: 'eraser', categoryId: anotherCatId});

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
      const anotherCategorytId = new ObjectID();
      const pen = await productRepo.create({
        name: 'pen',
        categoryId: categoryId,
      });
      const pencil = await productRepo.create({
        name: 'pencil',
        categoryId: categoryId,
      });
      const eraser = await productRepo.create({
        name: 'eraser',
        categoryId: anotherCategorytId,
      });

      const result = buildLookupMap<unknown, Product, Category[]>(
        [pen, eraser, pencil],
        'categoryId',
        reduceAsArray,
      );
      // expects this map to have String/Product pair
      const expected = new Map<String, Array<Product>>();
      const strId1 = categoryId.toString();
      const strId2 = anotherCategorytId.toString();
      expected.set(strId1, [pen, pencil]);
      expected.set(strId2, [eraser]);
      expect(result).to.eql(expected);
    });
  });

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

  class ProductRepository extends DefaultCrudRepository<
    Product,
    typeof Product.prototype.id
  > {
    public readonly category: BelongsToAccessor<
      Category,
      typeof Product.prototype.id
    >;
    constructor(
      dataSource: juggler.DataSource,
      categoryRepository?: Getter<CategoryRepository>,
    ) {
      super(Product, dataSource);
      if (categoryRepository)
        this.category = this.createBelongsToAccessorFor(
          'category',
          categoryRepository,
        );
    }
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

  class CategoryRepository extends DefaultCrudRepository<
    Category,
    typeof Category.prototype.id,
    CategoryRelations
  > {
    public readonly products: HasManyRepositoryFactory<
      Product,
      typeof Category.prototype.id
    >;
    constructor(
      dataSource: juggler.DataSource,
      productRepository: Getter<ProductRepository>,
    ) {
      super(Category, dataSource);
      this.products = this.createHasManyRepositoryFactoryFor(
        'products',
        productRepository,
      );
    }
  }
});

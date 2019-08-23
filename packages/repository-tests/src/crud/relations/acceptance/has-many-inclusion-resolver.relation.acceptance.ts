// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository-tests
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect, skipIf, toJSON} from '@loopback/testlab';
import {Suite} from 'mocha';
import {
  CrudFeatures,
  CrudRepositoryCtor,
  CrudTestContext,
  DataSourceOptions,
} from '../../..';
import {
  deleteAllModelsInDefaultDataSource,
  MixedIdType,
  withCrudCtx,
} from '../../../helpers.repository-tests';
import {
  Customer,
  CustomerRepository,
  Order,
  OrderRepository,
} from '../fixtures/models';
import {givenBoundCrudRepositories} from '../helpers';

export function hasManyRelationAcceptance(
  dataSourceOptions: DataSourceOptions,
  repositoryClass: CrudRepositoryCtor,
  features: CrudFeatures,
) {
  skipIf<[(this: Suite) => void], void>(
    !features.supportsInclusionResolvers,
    describe,
    'retrieve models including relations',
    () => {
      describe('HasMany inclusion resolvers - acceptance', () => {
        before(deleteAllModelsInDefaultDataSource);
        let customerRepo: CustomerRepository;
        let orderRepo: OrderRepository;
        let existingCustomerId: MixedIdType;

        before(
          withCrudCtx(async function setupRepository(ctx: CrudTestContext) {
            // when running the test suite on MongoDB, we don't really need to setup
            // this config for mongo connector to pass the test.
            // however real-world applications might have such config for MongoDB
            // setting it up to check if it works fine as well
            Order.definition.properties.customerId.type = features.idType;
            Order.definition.properties.customerId.mongodb = {
              dataType: 'ObjectID',
            };
            // this helper should create the inclusion resolvers for us
            ({customerRepo, orderRepo} = givenBoundCrudRepositories(
              ctx.dataSource,
              repositoryClass,
            ));
            // inclusionResolvers should be defined. And resolver for each
            // relation should be created by the hasManyFactory at this point.
            expect(customerRepo.inclusionResolvers).to.not.be.undefined();
            expect(orderRepo.inclusionResolvers).to.not.be.undefined();
            expect(customerRepo.orders.inclusionResolver).to.not.be.undefined();
            expect(
              customerRepo.customers.inclusionResolver,
            ).to.not.be.undefined();
            // inclusionResolvers shouldn't setup yet at this point
            expect(customerRepo.inclusionResolvers).to.deepEqual(new Map());

            await ctx.dataSource.automigrate([Customer.name, Order.name]);
          }),
        );

        beforeEach(async () => {
          customerRepo.inclusionResolvers.set(
            'orders',
            customerRepo.orders.inclusionResolver,
          );
          customerRepo.inclusionResolvers.set(
            'customers',
            customerRepo.customers.inclusionResolver,
          );
          await customerRepo.deleteAll();
          await orderRepo.deleteAll();
        });

        it("defines a repository's inclusionResolvers property", () => {
          expect(customerRepo.inclusionResolvers).to.not.be.undefined();
          expect(orderRepo.inclusionResolvers).to.not.be.undefined();
        });

        it("throws an error if the repository doesn't have such relation names", async () => {
          await orderRepo.create({
            customerId: existingCustomerId,
            description: 'Order from Order McForder, the hoarder of Mordor',
          });
          await expect(
            customerRepo.find({include: [{relation: 'managers'}]}),
          ).to.be.rejectedWith(
            `Invalid "filter.include" entries: {"relation":"managers"}`,
          );
        });

        it('throws error if the target repository does not have the registered resolver', async () => {
          await orderRepo.create({
            customerId: existingCustomerId,
            description: 'Order from Order McForder, the hoarder of Mordor',
          });
          // unregister the resolver
          customerRepo.inclusionResolvers.delete('orders');

          await expect(
            customerRepo.find({include: [{relation: 'orders'}]}),
          ).to.be.rejectedWith(
            `Invalid "filter.include" entries: {"relation":"orders"}`,
          );
          // reset
          customerRepo.inclusionResolvers.set(
            'orders',
            customerRepo.orders.inclusionResolver,
          );
        });

        it('simple has-many relation retrieve via find() method', async () => {
          const c1 = await customerRepo.create({name: 'c1'});
          const o1 = await orderRepo.create({
            customerId: c1.id,
            description: 'order from c1',
          });
          const result = await customerRepo.find({
            include: [{relation: 'orders'}],
          });

          const expected = {
            id: c1.id,
            name: 'c1',
            orders: [
              {
                id: o1.id,
                description: 'order from c1',
                customerId: c1.id,
                isShipped: features.emptyValue,
                // eslint-disable-next-line @typescript-eslint/camelcase
                shipment_id: features.emptyValue,
              },
            ],
            parentId: features.emptyValue,
          };
          expect(toJSON(result)).to.deepEqual([toJSON(expected)]);
        });

        it('returns related instances to target models via find() method', async () => {
          const c1 = await customerRepo.create({name: 'Thor'});
          const c2 = await customerRepo.create({name: 'Hella'});
          const o1 = await orderRepo.create({
            customerId: c1.id,
            description: 'Mjolnir',
          });
          const o2 = await orderRepo.create({
            customerId: c1.id,
            description: 'Pizza',
          });
          const o3 = await orderRepo.create({
            customerId: c2.id,
            description: 'Blade',
          });

          const result = await customerRepo.find({
            include: [{relation: 'orders'}],
          });

          const expected = [
            {
              id: c1.id,
              name: 'Thor',
              orders: [
                {
                  id: o1.id,
                  description: 'Mjolnir',
                  customerId: c1.id,
                  isShipped: features.emptyValue,
                  // eslint-disable-next-line @typescript-eslint/camelcase
                  shipment_id: features.emptyValue,
                },
                {
                  id: o2.id,
                  description: 'Pizza',
                  customerId: c1.id,
                  isShipped: features.emptyValue,
                  // eslint-disable-next-line @typescript-eslint/camelcase
                  shipment_id: features.emptyValue,
                },
              ],
              parentId: features.emptyValue,
            },
            {
              id: c2.id,
              name: 'Hella',
              orders: [
                {
                  id: o3.id,
                  description: 'Blade',
                  customerId: c2.id,
                  isShipped: features.emptyValue,
                  // eslint-disable-next-line @typescript-eslint/camelcase
                  shipment_id: features.emptyValue,
                },
              ],
              parentId: features.emptyValue,
            },
          ];
          expect(toJSON(result)).to.deepEqual(toJSON(expected));
        });

        it('returns related instances to target models via findById() method', async () => {
          const c1 = await customerRepo.create({name: 'Thor'});
          const c2 = await customerRepo.create({name: 'Hella'});
          await orderRepo.create({
            customerId: c1.id,
            description: 'Mjolnir',
          });
          await orderRepo.create({
            customerId: c1.id,
            description: 'Pizza',
          });
          const o3 = await orderRepo.create({
            customerId: c2.id,
            description: 'Blade',
          });

          const result = await customerRepo.findById(c2.id, {
            include: [{relation: 'orders'}],
          });
          const expected = {
            id: c2.id,
            name: 'Hella',
            orders: [
              {
                id: o3.id,
                description: 'Blade',
                customerId: c2.id,
                isShipped: features.emptyValue,
                // eslint-disable-next-line @typescript-eslint/camelcase
                shipment_id: features.emptyValue,
              },
            ],
            parentId: features.emptyValue,
          };
          expect(toJSON(result)).to.deepEqual(toJSON(expected));
        });

        it('throws when navigational properties are present when updating model instance', async () => {
          const created = await customerRepo.create({name: 'c1'});
          const customerId = created.id;

          await orderRepo.create({
            description: 'Pen',
            customerId,
          });

          const found = await customerRepo.findById(customerId, {
            include: [{relation: 'orders'}],
          });
          expect(found.orders).to.have.lengthOf(1);

          found.name = 'updated name';
          await expect(customerRepo.save(found)).to.be.rejectedWith(
            'The `Customer` instance is not valid. Details: `orders` is not defined in the model (value: undefined).',
          );
        });
      });
    },
  );
}

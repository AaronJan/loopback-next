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
  Address,
  AddressRepository,
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
      describe('BelongsTo inclusion resolvers - acceptance', () => {
        before(deleteAllModelsInDefaultDataSource);
        let customerRepo: CustomerRepository;
        let addressRepo: AddressRepository;
        let existingCustomerId: MixedIdType;

        before(
          withCrudCtx(async function setupRepository(ctx: CrudTestContext) {
            // when running the test suite on MongoDB, we don't really need to setup
            // this config for mongo connector to pass the test.
            // however real-world applications might have such config for MongoDB
            // setting it up to check if it works fine as well
            Address.definition.properties.customerId.type = features.idType;
            Address.definition.properties.customerId.mongodb = {
              dataType: 'ObjectID',
            };
            // this helper should create the inclusion resolvers for us
            ({customerRepo, addressRepo} = givenBoundCrudRepositories(
              ctx.dataSource,
              repositoryClass,
            ));
            // inclusionResolvers should be defined. And resolver for each
            // relation should be created by the belongsToFactory at this point.
            expect(customerRepo.inclusionResolvers).to.not.be.undefined();
            expect(addressRepo.inclusionResolvers).to.not.be.undefined();
            expect(
              addressRepo.customer!.inclusionResolver,
            ).to.not.be.undefined();

            // inclusionResolvers shouldn't setup yet at this point
            expect(customerRepo.inclusionResolvers).to.deepEqual(new Map());

            await ctx.dataSource.automigrate([Customer.name, Address.name]);
          }),
        );

        beforeEach(async () => {
          addressRepo.inclusionResolvers.set(
            'customer',
            addressRepo.customer!.inclusionResolver,
          );
          await customerRepo.deleteAll();
          await addressRepo.deleteAll();
        });

        it("defines a repository's inclusionResolvers property", () => {
          expect(customerRepo.inclusionResolvers).to.not.be.undefined();
          expect(addressRepo.inclusionResolvers).to.not.be.undefined();
        });

        it("throws an error if the repository doesn't have such relation names", async () => {
          await addressRepo.create({
            street: 'home of Thor Rd.',
            city: 'Thrudheim',
            province: 'Asgard',
            zipcode: '8200',
            customerId: existingCustomerId,
          });
          await expect(
            addressRepo.find({include: [{relation: 'home'}]}),
          ).to.be.rejectedWith(
            `Invalid "filter.include" entries: {"relation":"home"}`,
          );
        });

        it('throws error if the target repository does not have the registered resolver', async () => {
          await addressRepo.create({
            street: 'home of Thor Rd.',
            city: 'Thrudheim',
            province: 'Asgard',
            zipcode: '8200',
            customerId: existingCustomerId,
          });
          // unregister the resolver
          addressRepo.inclusionResolvers.delete('customer');

          await expect(
            addressRepo.find({include: [{relation: 'customer'}]}),
          ).to.be.rejectedWith(
            `Invalid "filter.include" entries: {"relation":"customer"}`,
          );
        });

        it('simple belongs-to relation retrieve via find() method', async () => {
          const thor = await customerRepo.create({name: 'Thor'});
          const address = await addressRepo.create({
            street: 'home of Thor Rd.',
            city: 'Thrudheim',
            province: 'Asgard',
            zipcode: '8200',
            customerId: thor.id,
          });
          const result = await addressRepo.find({
            include: [{relation: 'customer'}],
          });

          const expected = {
            ...address,
            customer: {
              id: thor.id,
              name: 'Thor',
              parentId: features.emptyValue,
            },
          };
          expect(toJSON(result)).to.deepEqual([toJSON(expected)]);
        });

        it('returns related instances to target models via find() method', async () => {
          const thor = await customerRepo.create({name: 'Thor'});
          const odin = await customerRepo.create({name: 'Odin'});
          const addr1 = await addressRepo.create({
            street: 'home of Thor Rd.',
            city: 'Thrudheim',
            province: 'Asgard',
            zipcode: '999',
            customerId: thor.id,
          });
          const addr2 = await addressRepo.create({
            street: 'home of Odin Rd.',
            city: 'Valhalla',
            province: 'Asgard',
            zipcode: '000',
            customerId: odin.id,
          });

          const result = await addressRepo.find({
            include: [{relation: 'customer'}],
          });

          const expected = [
            {
              ...addr1,
              customer: {
                id: thor.id,
                name: 'Thor',
                parentId: features.emptyValue,
              },
            },
            {
              ...addr2,
              customer: {
                id: odin.id,
                name: 'Odin',
                parentId: features.emptyValue,
              },
            },
          ];
          expect(toJSON(result)).to.deepEqual(toJSON(expected));
        });

        it('returns related instances to target models via findById() method', async () => {
          const thor = await customerRepo.create({name: 'Thor'});
          const odin = await customerRepo.create({name: 'Odin'});
          await addressRepo.create({
            street: 'home of Thor Rd.',
            city: 'Thrudheim',
            province: 'Asgard',
            zipcode: '999',
            customerId: thor.id,
          });
          const addr2 = await addressRepo.create({
            street: 'home of Odin Rd.',
            city: 'Valhalla',
            province: 'Asgard',
            zipcode: '000',
            customerId: odin.id,
          });

          const result = await addressRepo.findById(addr2.id, {
            include: [{relation: 'customer'}],
          });
          const expected = {
            ...addr2,
            customer: {
              id: odin.id,
              name: 'Odin',
              parentId: features.emptyValue,
            },
          };
          expect(toJSON(result)).to.deepEqual(toJSON(expected));
        });
      });
    },
  );
}

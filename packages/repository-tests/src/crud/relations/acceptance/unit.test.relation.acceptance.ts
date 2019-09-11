// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository-tests
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect} from '@loopback/testlab';
import {
  CrudFeatures,
  CrudRepositoryCtor,
  CrudTestContext,
  DataSourceOptions,
} from '../../..';
import {
  deleteAllModelsInDefaultDataSource,
  withCrudCtx,
} from '../../../helpers.repository-tests';
import {
  Customer,
  CustomerRepository,
  Address,
  AddressRepository,
} from '../fixtures/models';
import {givenBoundCrudRepositories} from '../helpers';
import {isBsonType, uniq} from '@loopback/repository';

export function hasManyRelationAcceptance(
  dataSourceOptions: DataSourceOptions,
  repositoryClass: CrudRepositoryCtor,
  features: CrudFeatures,
) {
  describe.only('Unit test for helpers uniq() and isBsonType()', () => {
    // mainly test on these two helpers on  belongTo relation
    // as it's only relation type that uses the helpers for now
    before(deleteAllModelsInDefaultDataSource);
    let customerRepo: CustomerRepository;
    let addressRepo: AddressRepository;
    before(
      withCrudCtx(async function setupRepository(ctx: CrudTestContext) {
        // this unit test aims to test the functionality over mongodb
        Address.definition.properties.customerId.type = features.idType;
        Address.definition.properties.customerId.mongodb = {
          dataType: 'ObjectID',
        };
        // this helper should create the inclusion resolvers for us
        ({customerRepo, addressRepo} = givenBoundCrudRepositories(
          ctx.dataSource,
          repositoryClass,
        ));
        await ctx.dataSource.automigrate([Customer.name, Address.name]);
      }),
    );
    beforeEach(async () => {
      await customerRepo.deleteAll();
      await addressRepo.deleteAll();
    });
    it('isBsontype', async () => {
      const red = await customerRepo.create({name: 'Redbone'});
      const id = red.id;
      const redAddr = await addressRepo.create({
        street: 'somewhere',
        city: 'over',
        province: 'theRainbow',
        zipcode: '8200',
        customerId: id,
      });
      if (typeof id === 'object' && id) {
        expect(isBsonType(id)).to.be.true();
      }
      if (typeof redAddr.id === 'object' && id) {
        expect(isBsonType(redAddr.id)).to.be.true();
      }
      if (typeof redAddr.customerId === 'object' && id) {
        expect(isBsonType(redAddr.customerId)).to.be.true();
      }
    });

    it('isBsontype + uniq', async () => {
      const red = await customerRepo.create({name: 'Redbone'});
      const rid = red.id;
      const redAddr = await addressRepo.create({
        street: 'somewhere',
        city: 'over',
        province: 'theRainbow',
        zipcode: '8200',
        customerId: rid,
      });
      const blue = await customerRepo.create({name: 'BlueMoon'});
      const bid = blue.id;
      const blueAddr = await addressRepo.create({
        street: 'blueMoon',
        city: 'standing',
        province: 'alone',
        zipcode: '0028',
        customerId: bid,
      });
      const sourceIdRed = redAddr.customerId;
      const sourceIdBlue = blueAddr.customerId;
      // mongo
      if (typeof redAddr.id === 'object' && rid) {
        sourceIdRed.toString();
      }
      if (typeof blueAddr.id === 'object' && rid) {
        sourceIdBlue.toString();
      }
      const expectedIds = [sourceIdRed, sourceIdBlue];

      const result = uniq([
        redAddr.customerId,
        blueAddr.customerId,
        redAddr.customerId,
      ]);
      expect(result).to.deepEqual(expectedIds);
    });
  });
}

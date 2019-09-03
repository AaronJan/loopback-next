// Copyright IBM Corp. 2018,2019. All Rights Reserved.
// Node module: @loopback/example-todo
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {inject} from '@loopback/core';
import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {TodoWithId, TodoWithIdWithRelations} from '../models';

export class TodoWithIdRepository extends DefaultCrudRepository<
  TodoWithId,
  typeof TodoWithId.prototype.id,
  TodoWithIdWithRelations
> {
  constructor(@inject('datasources.db') dataSource: juggler.DataSource) {
    super(TodoWithId, dataSource);
  }
}

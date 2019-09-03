// Copyright IBM Corp. 2018,2019. All Rights Reserved.
// Node module: @loopback/example-todo
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Entity, model, property} from '@loopback/repository';

@model()
export class TodoWithId extends Entity {
  @property({
    type: 'number',
    id: true,
    required: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  title: string;

  @property({
    type: 'string',
  })
  desc?: string;

  constructor(data?: Partial<TodoWithId>) {
    super(data);
  }
}

export interface TodoWithIdRelations {
  // describe navigational properties here
}

export type TodoWithIdWithRelations = TodoWithId & TodoWithIdRelations;

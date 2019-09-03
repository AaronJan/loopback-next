// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/example-todo
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {inject} from '@loopback/core';
import {Filter, repository} from '@loopback/repository';
import {
  del,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
} from '@loopback/rest';
import {TodoWithId} from '../models';
import {TodoWithIdRepository} from '../repositories';
import {GeocoderService} from '../services';

export class TodoWithIdController {
  constructor(
    @repository(TodoWithIdRepository) protected todoRepo: TodoWithIdRepository,
    @inject('services.GeocoderService') protected geoService: GeocoderService,
  ) {}

  @post('/todosWithId', {
    responses: {
      '200': {
        description: 'Todo model instance',
        content: {'application/json': {schema: getModelSchemaRef(TodoWithId)}},
      },
    },
  })
  async createTodo(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(TodoWithId),
        },
      },
    })
    todo: TodoWithId,
  ): Promise<TodoWithId> {
    return this.todoRepo.create(todo);
  }

  @get('/todosWithId/{id}', {
    responses: {
      '200': {
        description: 'Todo model instance',
        content: {'application/json': {schema: getModelSchemaRef(TodoWithId)}},
      },
    },
  })
  async findTodoById(@param.path.number('id') id: number): Promise<TodoWithId> {
    return this.todoRepo.findById(id);
  }

  @get('/todosWithId', {
    responses: {
      '200': {
        description: 'Array of Todo model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(TodoWithId)},
          },
        },
      },
    },
  })
  async findTodos(
    @param.query.object('filter', getFilterSchemaFor(TodoWithId))
    filter?: Filter<TodoWithId>,
  ): Promise<TodoWithId[]> {
    return this.todoRepo.find(filter);
  }

  @put('/todosWithId/{id}', {
    responses: {
      '204': {
        description: 'Todo PUT success',
      },
    },
  })
  async replaceTodo(
    @param.path.number('id') id: number,
    @requestBody() todo: TodoWithId,
  ): Promise<void> {
    await this.todoRepo.replaceById(id, todo);
  }

  @patch('/todosWithId/{id}', {
    responses: {
      '204': {
        description: 'Todo PATCH success',
      },
    },
  })
  async updateTodo(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(TodoWithId, {partial: true}),
        },
      },
    })
    todo: Partial<TodoWithId>,
  ): Promise<void> {
    await this.todoRepo.updateById(id, todo);
  }

  @del('/todosWithId/{id}', {
    responses: {
      '204': {
        description: 'Todo DELETE success',
      },
    },
  })
  async deleteTodo(@param.path.number('id') id: number): Promise<void> {
    await this.todoRepo.deleteById(id);
  }
}

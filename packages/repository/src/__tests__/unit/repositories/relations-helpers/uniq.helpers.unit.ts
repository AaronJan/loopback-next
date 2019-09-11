// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect} from '@loopback/testlab';
import {uniq} from '../../../..';

describe('helper unit test for uniq', () => {
  it('de-duplicate an empty array', () => {
    expect(uniq([])).to.deepEqual([]);
  });
  it('de-duplicate a single item array', () => {
    expect(uniq([1])).to.deepEqual([1]);
  });
  it('de-duplicate an array that has multi unique items', () => {
    expect(uniq([1, 3, 2])).to.deepEqual([1, 3, 2]);
  });
  it('de-duplicate an array that has multi duplicate items', () => {
    expect(uniq(['a', 'a'])).to.deepEqual(['a']);
  });
  it('de-duplicate an array that has many items', () => {
    expect(uniq([1, 'a', 1, 2, 'a'])).to.deepEqual([1, 'a', 2]);
    expect(uniq([1, 'a', 1, 2, 'a'])).to.not.deepEqual(['a', 1, 2]);
  });
});

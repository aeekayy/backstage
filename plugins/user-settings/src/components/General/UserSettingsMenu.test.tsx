/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  MockErrorApi,
  renderInTestApp,
  TestApiProvider,
  renderWithEffects,
  wrapInTestApp,
} from '@backstage/test-utils';
import { errorApiRef, identityApiRef } from '@backstage/core-plugin-api';
import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { UserSettingsMenu } from './UserSettingsMenu';

describe('<UserSettingsMenu />', () => {
  it('displays a menu button with a sign-out option', async () => {
    const rendered = await renderWithEffects(
      wrapInTestApp(<UserSettingsMenu />),
    );

    const menuButton = rendered.getByLabelText('more');
    fireEvent.click(menuButton);

    expect(rendered.getByText('Sign Out')).toBeInTheDocument();
  });

  it('handles errors that occur when signing out', async () => {
    const failingIdentityApi = {
      signOut: jest.fn().mockRejectedValue(new Error('Logout error')),
    };
    const mockErrorApi = new MockErrorApi({ collect: true });
    const rendered = await renderInTestApp(
      <TestApiProvider
        apis={[
          [errorApiRef, mockErrorApi],
          [identityApiRef, failingIdentityApi],
        ]}
      >
        <UserSettingsMenu />
      </TestApiProvider>,
    );

    const menuButton = rendered.getByLabelText('more');
    fireEvent.click(menuButton);
    fireEvent.click(rendered.getByText('Sign Out'));

    await waitFor(() => {
      expect(mockErrorApi.getErrors()).toHaveLength(1);
    });
  });
});

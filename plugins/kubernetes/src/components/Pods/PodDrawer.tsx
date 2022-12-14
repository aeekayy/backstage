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

import React from 'react';
import { V1Pod } from '@kubernetes/client-node';
import {
  containersReady,
  containerStatuses,
  totalRestarts,
  imageChips,
  renderCondition,
} from '../../utils/pod';
import { KubernetesDrawer } from '../KubernetesDrawer/KubernetesDrawer';

/** @public */
export const PodDrawer = (props: { pod: V1Pod; expanded?: boolean }) => {
  const { pod, expanded } = props;

  return (
    <KubernetesDrawer
      object={pod}
      expanded={expanded}
      kind="Pod"
      renderObject={(podObject: V1Pod) => {
        const phase = podObject.status?.phase ?? 'unknown';

        const ports =
          podObject.spec?.containers?.map(c => {
            return {
              [c.name]: c.ports,
            };
          }) ?? 'N/A';

        const conditions = (podObject.status?.conditions ?? [])
          .map(renderCondition)
          .reduce((accum, next) => {
            accum[next[0]] = next[1];
            return accum;
          }, {} as { [key: string]: React.ReactNode });

        return {
          images: imageChips(podObject),
          phase: phase,
          'Containers Ready': containersReady(podObject),
          'Total Restarts': totalRestarts(podObject),
          'Container Statuses': containerStatuses(podObject),
          ...conditions,
          'Exposed ports': ports,
        };
      }}
    />
  );
};

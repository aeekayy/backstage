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

import { topPods } from '@kubernetes/client-node';
import lodash, { Dictionary } from 'lodash';
import { Logger } from 'winston';
import {
  ClusterDetails,
  FetchResponseWrapper,
  KubernetesFetcher,
  KubernetesObjectTypes,
  ObjectFetchParams,
  ObjectToFetch,
} from '../types/types';
import {
  FetchResponse,
  KubernetesFetchError,
  KubernetesErrorTypes,
  PodStatusFetchResponse,
} from '@backstage/plugin-kubernetes-common';
import { KubernetesClientProvider } from './KubernetesClientProvider';

export interface KubernetesClientBasedFetcherOptions {
  kubernetesClientProvider: KubernetesClientProvider;
  logger: Logger;
}

type FetchResult = FetchResponse | KubernetesFetchError;

const isError = (fr: FetchResult): fr is KubernetesFetchError =>
  fr.hasOwnProperty('errorType');

function fetchResultsToResponseWrapper(
  results: FetchResult[],
): FetchResponseWrapper {
  const groupBy: Dictionary<FetchResult[]> = lodash.groupBy(results, value => {
    return isError(value) ? 'errors' : 'responses';
  });

  return {
    errors: groupBy.errors ?? [],
    responses: groupBy.responses ?? [],
  } as FetchResponseWrapper; // TODO would be nice to get rid of this 'as'
}

const statusCodeToErrorType = (statusCode: number): KubernetesErrorTypes => {
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED_ERROR';
    case 404:
      return 'NOT_FOUND';
    case 500:
      return 'SYSTEM_ERROR';
    default:
      return 'UNKNOWN_ERROR';
  }
};

export class KubernetesClientBasedFetcher implements KubernetesFetcher {
  private readonly kubernetesClientProvider: KubernetesClientProvider;
  private readonly logger: Logger;

  constructor({
    kubernetesClientProvider,
    logger,
  }: KubernetesClientBasedFetcherOptions) {
    this.kubernetesClientProvider = kubernetesClientProvider;
    this.logger = logger;
  }

  fetchObjectsForService(
    params: ObjectFetchParams,
  ): Promise<FetchResponseWrapper> {
    const fetchResults = Array.from(params.objectTypesToFetch)
      .concat(params.customResources)
      .map(toFetch => {
        return this.fetchResource(
          params.clusterDetails,
          toFetch,
          params.labelSelector ||
            `backstage.io/kubernetes-id=${params.serviceId}`,
          toFetch.objectType,
          params.namespace,
        ).catch(this.captureKubernetesErrorsRethrowOthers.bind(this));
      });

    return Promise.all(fetchResults).then(fetchResultsToResponseWrapper);
  }

  fetchPodMetricsByNamespaces(
    clusterDetails: ClusterDetails,
    namespaces: Set<string>,
  ): Promise<FetchResponseWrapper> {
    const metricsClient =
      this.kubernetesClientProvider.getMetricsClient(clusterDetails);
    const coreApi =
      this.kubernetesClientProvider.getCoreClientByClusterDetails(
        clusterDetails,
      );

    const fetchResults = Array.from(namespaces).map(ns =>
      topPods(coreApi, metricsClient, ns)
        .then(r => {
          return {
            type: 'podstatus',
            resources: r,
          } as PodStatusFetchResponse;
        })
        .catch(this.captureKubernetesErrorsRethrowOthers.bind(this)),
    );

    return Promise.all(fetchResults).then(fetchResultsToResponseWrapper);
  }

  private captureKubernetesErrorsRethrowOthers(e: any): KubernetesFetchError {
    if (e.response && e.response.statusCode) {
      this.logger.warn(
        `statusCode=${e.response.statusCode} for resource ${
          e.response.request.uri.pathname
        } body=[${JSON.stringify(e.response.body)}]`,
      );
      return {
        errorType: statusCodeToErrorType(e.response.statusCode),
        statusCode: e.response.statusCode,
        resourcePath: e.response.request.uri.pathname,
      };
    }
    throw e;
  }

  private fetchResource(
    clusterDetails: ClusterDetails,
    resource: ObjectToFetch,
    labelSelector: string,
    objectType: KubernetesObjectTypes,
    namespace?: string,
  ): Promise<FetchResponse> {
    const customObjects =
      this.kubernetesClientProvider.getCustomObjectsClient(clusterDetails);

    customObjects.addInterceptor((requestOptions: any) => {
      requestOptions.uri = requestOptions.uri.replace('/apis//v1/', '/api/v1/');
    });

    if (namespace) {
      return customObjects
        .listNamespacedCustomObject(
          resource.group,
          resource.apiVersion,
          namespace,
          resource.plural,
          '',
          false,
          '',
          '',
          labelSelector,
        )
        .then(r => {
          return {
            type: objectType,
            resources: (r.body as any).items,
          };
        });
    }
    return customObjects
      .listClusterCustomObject(
        resource.group,
        resource.apiVersion,
        resource.plural,
        '',
        false,
        '',
        '',
        labelSelector,
      )
      .then(r => {
        return {
          type: objectType,
          resources: (r.body as any).items,
        };
      });
  }
}

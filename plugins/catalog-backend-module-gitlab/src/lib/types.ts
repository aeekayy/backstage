/*
 * Copyright 2021 The Backstage Authors
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

import { TaskScheduleDefinition } from '@backstage/backend-tasks';

export type GitlabGroupDescription = {
  id: number;
  web_url: string;
  projects: GitLabProject[];
};

export type GitLabProject = {
  id: number;
  default_branch?: string;
  archived: boolean;
  last_activity_at: string;
  web_url: string;
  path_with_namespace?: string;
};

export type GitlabProviderConfig = {
  host: string;
  group: string;
  id: string;
  branch: string;
  catalogFile: string;
  projectPattern: RegExp;
  schedule?: TaskScheduleDefinition;
};

## API Report File for "@backstage/plugin-allure"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts
/// <reference types="react" />

import { BackstagePlugin } from '@backstage/core-plugin-api';
import { Entity } from '@backstage/catalog-model';
import { RouteRef } from '@backstage/core-plugin-api';

// @public (undocumented)
export const ALLURE_PROJECT_ID_ANNOTATION = 'qameta.io/allure-project';

// @public (undocumented)
export const allurePlugin: BackstagePlugin<
  {
    root: RouteRef<undefined>;
  },
  {},
  {}
>;

// @public (undocumented)
export const EntityAllureReportContent: () => JSX.Element;

// @public (undocumented)
export const isAllureReportAvailable: (entity: Entity) => boolean;
```

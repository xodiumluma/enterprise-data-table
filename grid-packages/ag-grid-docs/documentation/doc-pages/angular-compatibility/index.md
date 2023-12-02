---
title: "Version Compatibility"
frameworks: ["angular"]
---

The following page provides information that is relevant when using older versions of Angular / AG Grid.

 ## AG Grid & Angular Compatibility Chart

 The table below gives the ranges of compatible versions of AG Grid with Angular versions.
 
 | Angular | AG Grid   | AG Grid Legacy    |
 | --------| --------- | ------------------|
 | 16 - 17+| 28 - 31+  | N/A               |
 | 14 - 15 | 25 - 31   | N/A               |
 | 12 - 13 | 25 - 30   | N/A               |
 | 10 - 11 | 24 - 27   | 28 - 29           |
 | 9       | 23 - 27   | 28                |
 | 8       | 18 - 27   | 28                |
 | 6 - 7   | 18 - 22   |                   |

 ## Future Support of Angular versions

AG Grid currently supports Angular v14 and above. Since AG Grid v31 we are now aligned to support Angular Long-term (LTS) versions on an ongoing basis. See [Angular Support policy and schedule](https://angular.io/guide/releases#support-policy-and-schedule). 

## AG Grid Legacy

<note>
AG Grid Legacy is only required for apps on Angular v8-11 that wish to use AG Grid v28 or v29.
</note>

In AG Grid v28 the package `ag-grid-angular` was migrated to the Ivy distribution format. This is the [recommended](https://angular.io/guide/creating-libraries#publishing-libraries) format for Angular libraries from v12. As a result, v28+ of AG Grid will only compile in Angular v12+.

To enable applications on Angular v8-11 to use AG Grid v28 or Angular applications on v10-11 to use AG Grid v29 features, the `ag-grid-angular-legacy` package has been created. This package is published in the legacy View Engine format. It can be consumed by older versions of Angular via the `ngcc` compiler.

If you are using [AG Grid Modules](https://ag-grid.com/angular-data-grid/packages-modules/) the same change as been applied to `@ag-grid-community/angular` and the corresponding legacy module is `@ag-grid-community/angular-legacy`.

### Migration to AG Grid v28+

#### Angular v12+

To migrate applications on Angular v12+ to AG Grid v28+ requires no dependency changes. There are [breaking changes](https://ag-grid.com/changelog/?fixVersion=28.0.0), notably `AgGridModule` no longer supports `.withComponents()` as it is not required any more.

<snippet transform={false} language="diff">
| @NgModule({
|     imports: [
|-         AgGridModule.withComponents([SquareComponent]),
|+         AgGridModule,
|     ]
| })
</snippet>

#### Angular v8-11
To migrate an application on Angular v8-11 to AG Grid v28+ the following changes are required in `package.json`.

<snippet transform={false} language="diff">
|"dependencies": {
|    ...
|-    "ag-grid-angular": "^27.3.0",
|+    "ag-grid-angular-legacy": "^28.0.0",
|    ...
</snippet>

Import paths will also need to be updated to match the new dependency.

<snippet transform={false} language="diff">
|- import { AgGridModule } from 'ag-grid-angular';
|+ import { AgGridModule } from 'ag-grid-angular-legacy';
</snippet>

The only difference between the standard and legacy packages is the Angular distribution format, so aside from standard major version breaking changes, the legacy package should act like a drop in replacement.

## Notes on Angular 12+

If using Angular 12+ and versions of AG Grid up to v27 the following warning may be present in the build output. To avoid this, upgrade to v28 of AG Grid which is published as an Ivy distribution.

<snippet transform={false} language="bash">
|Generating browser application bundles (phase: setup)...
|Processing legacy "View Engine" libraries:
|- ag-grid-angular [es2015/esm2015]
|Encourage the library authors to publish an Ivy distribution.
</snippet>

## Notes on Angular Components 10-11

If you are using Angular v10-11 and have Ivy **disabled** via `enableIvy: false` then you must declare your custom components with the AgGridModule via the `withComponents` method. This enables AG Grid to be able to use your Angular components by adding them as `entryComponents` for you. You need to provide them in the **top level** `NgModule`:

<snippet transform={false}>
| @NgModule({
|     imports: [
|         BrowserModule,
|         AgGridModule.withComponents(
|             [
|                 SquareComponent,      // Components to be used within the Grid
|                 CubeComponent,
|                 // ...other components
|             ]
|         ),
|     ]
| })
</snippet>

## Notes on Angular 10

Due to a breaking change in Angular 10 you may experience the following error when building:
`Generic type 'ModuleWithProviders<T>' requires 1 type argument(s)`<br/><br/>
If you wish to use Angular 10 with AG Grid versions 18-23 then you need to set `"skipLibCheck": true`
in `tsconfig.app.json` Please note however that this is a workaround and Angular 10 is only
officially supported with AG Grid 24+.
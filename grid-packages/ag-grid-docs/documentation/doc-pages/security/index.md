---
title: "Security"
---

The grid allows you to work with security tools and parameters to make your application meet your business requirements.

## Content Security Policy (CSP)

The basic information on Content Security Policy can be found on the [MDN web docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) website and will cover the necessary information on the subject. The grid works with CSP, but some basic configuration is necessary to have your application load correctly. Below is detailed what the minimum set of CSP rules for the grid is and why.

### script-src

The `script-src` policy will work only with `'self'` rule. If you are working with expressions / code parsing inside of the grid instead of functions, it will be necessary to add the `unsafe-eval` rule to your policy.

Using expressions instead of functions is an option for many grid properties such as [Cell Class Rules](/cell-styles/#cell-class-rules) and [Value Getters](/value-getters/). Below demonstrates the difference where expressions are used instead of functions.

<snippet>
const gridOptions = {
    columnDefs: [
        // this column definition does NOT use expressions. no need for unsafe-eval
        {
            cellClassRules: {
                'rag-green': function(params) { return params.value < 20; },
                'rag-amber': function(params) { return params.value >= 20 && params.value < 25; },
                'rag-red': function(params) { return params.value >= 25; }
            },
            valueGetter: params => params.data.price * params.data.fx,
        },
        // this column definition does use expressions *** unsafe-eval is needed! ***
        {
            cellClassRules: {
                'rag-green': 'x < 20',
                'rag-amber': 'x >= 20 && x < 25',
                'rag-red': 'x >= 25'
            },
            valueGetter: 'data.price * data.fx',
        }
    ]
}
</snippet>

### style-src

The `style-src` policy requires the `unsafe-inline` due to the [DOM Row and Column Virtualisation](/dom-virtualisation/). The technique the grid uses to display position rows requires explicit positioning of the rows and columns. This positioning is only possible using CSS style attributes to set explicit X and Y positions. This is a feature that all data grids have. Without it, the data grid would have a very low limit on the amount of data that could be displayed.

<note>
|Even though the `style-src` policy requires `unsafe-inline`, the specific way AG Grid uses it causes no actual security vulnerability.
|
|The reason is that AG Grid doesn’t require `unsafe-inline` for scripts, but only for styles. The inline-style injection is only a problem if you allow users to upload their own content to your servers and then they can use injected styles to show that content over your page.
|
|Also, as styles aren't executed, a user would need to upload their own content to your servers and then reference it from an injected style. In order to fully prevent this scenario from occurring, we recommend sanitising user-uploaded content in your application to ensure that only valid content gets uploaded and fully prevent this risk.
</note>

### img-src

The `img-src` policy requires the `data:` rule. This is because the grid pre-loads SVG images as data strings. One example of such an image is the filter menu section divider. If the image was not preloaded, the grid would flicker when the menu shows, while the image is getting loaded.

### font-src

The `font-src` policy also requires the `data:` rule. This is for the same reason the grid pre-loads SVG images as strings, it also pre-loads the icon WebFont as a string. This is to make sure icons will not be initially empty and suddenly appear after the font is downloaded.

### Summary

In summary, the minimal rule to load the grid is:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src data:">
```

However if you are using expressions / code parsing, the rule is:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src data:">
```

## Security Vulnerability Testing

Applications may be required to pass an Application Security Test prior to being put into production. If your application is using AG Grid, you will want to make sure that AG Grid has also been tested for security vulnerabilities.

AG Grid is tested for a wide variety of security vulnerabilities using the [SonarQube](https://www.sonarqube.org/) automatic security testing tool. SonarQube performs testing using a number of security rules, covering well-established security vulnerability standards such as CWE, SANS Top 25 and OWASP Top 10. For more details please refer to the section on [Security-related Rules](https://docs.sonarqube.org/latest/user-guide/security-rules/#header-2).

## SonarQube Results

The SonarQube security test results for our main NPM packages are shown below:

| AG-Grid Package     | Result |
| ------------------- | ------ |
| ag-grid-community   | [![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=ag-grid-community)](https://sonarcloud.io/dashboard?id=ag-grid-community) |
| ag-grid-enterprise  | [![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=ag-grid-enterprise)](https://sonarcloud.io/dashboard?id=ag-grid-enterprise) |
| ag-charts-community | [![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=ag-charts-community)](https://sonarcloud.io/dashboard?id=ag-charts-community) |

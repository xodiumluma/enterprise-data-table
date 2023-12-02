import { convertTemplate,getImport,toConst,toInput,toMemberWithValue,toOutput } from './angular-utils';
import { templatePlaceholder } from "./grid-vanilla-src-parser";
import { addBindingImports,addGenericInterfaceImport,getActiveTheme,getIntegratedDarkModeCode,getPropertyInterfaces,handleRowGenericInterface,ImportType,isInstanceMethod,preferParamsApi,removeFunctionKeyword, replaceGridReadyRowData } from './parser-utils';
const path = require('path');

function getOnGridReadyCode(
    readyCode: string,
    resizeToFit: boolean,
    data: { url: string; callback: string },
    rowDataType: string | undefined,
    hasApi: boolean,
    exampleName: string
): string {
    const additionalLines = [];

    if (readyCode) {
        additionalLines.push(readyCode.trim().replace(/^\{|\}$/g, ''));
    }

    if (resizeToFit) {
        additionalLines.push('params.api.sizeColumnsToFit();');
    }

    if (data) {
        const { url, callback } = data;
        const setRowDataBlock = replaceGridReadyRowData(callback, 'this.rowData');        
        additionalLines.push(`this.http.get<${rowDataType}[]>(${url}).subscribe(data => ${setRowDataBlock});`);
    }
    const gridReadyEventParam = rowDataType !== 'any' ? `<${rowDataType}>` : '';
    if (hasApi || additionalLines.length > 0) {
        // use params in gridReady event
        const additional = preferParamsApi(additionalLines.length > 0
            ? `\n\n        ${additionalLines.join('\n        ')}`
            : ''
        );
        return `
        onGridReady(params: GridReadyEvent${gridReadyEventParam}) {
            ${getIntegratedDarkModeCode(exampleName, true)} 
            ${hasApi ? 'this.gridApi = params.api;' : ''}${additional}
        }`;
    } else {
        return '';
    }
}

function addModuleImports(imports: string[], bindings: any, allStylesheets: string[]): string[] {
    const { gridSettings, imports: bindingImports, properties } = bindings;

    imports.push('// NOTE: Angular CLI does not support component CSS imports: angular-cli/issues/23273');
    imports.push("import '@ag-grid-community/styles/ag-grid.css';");

    // to account for the (rare) example that has more than one class...just default to quartz if it does
    // we strip off any '-dark' from the theme when loading the CSS as dark versions are now embedded in the
    // "source" non dark version
    const theme = gridSettings.theme ? gridSettings.theme.replace('-dark', '') : 'ag-theme-quartz';
    imports.push(`import "@ag-grid-community/styles/${theme}.css";`);

    if (allStylesheets && allStylesheets.length > 0) {
        allStylesheets.forEach((styleSheet) => imports.push(`import '../${path.basename(styleSheet)}';`));
    }

    let propertyInterfaces = getPropertyInterfaces(properties);
    const bImports = [...(bindingImports || [])];
    bImports.push({
        module: `'@ag-grid-community/core'`,
        isNamespaced: false,
        imports: [...propertyInterfaces, 'GridReadyEvent', 'GridApi'],
    });

    if (bImports.length > 0) {
        addBindingImports(bImports, imports, false, true);
    }

    imports.push('// Required feature modules are registered in app.module.ts');

    return imports;
}

function addPackageImports(imports: string[], bindings: any, allStylesheets: string[]): string[] {
    const { gridSettings, imports: bindingImports, properties } = bindings;

    if (gridSettings.enterprise) {
        imports.push("import 'ag-grid-enterprise';");
    }

    imports.push("import 'ag-grid-community/styles/ag-grid.css';");

    // to account for the (rare) example that has more than one class...just default to quartz if it does
    // we strip off any '-dark' from the theme when loading the CSS as dark versions are now embedded in the
    // "source" non dark version
    const theme = gridSettings.theme ? gridSettings.theme.replace('-dark', '') : 'ag-theme-quartz';
    imports.push(`import "ag-grid-community/styles/${theme}.css";`);

    if (allStylesheets && allStylesheets.length > 0) {
        allStylesheets.forEach(styleSheet => imports.push(`import '../${path.basename(styleSheet)}';`));
    }

    let propertyInterfaces = getPropertyInterfaces(properties);
    const bImports = [...(bindingImports || [])];
    bImports.push({
        module: `'ag-grid-community'`,
        isNamespaced: false,
        imports: [...propertyInterfaces, 'GridReadyEvent', 'GridApi']
    })

    if (bImports.length > 0) {
        addBindingImports(bImports, imports, true, true);
    }

    return imports;
}

function getImports(bindings: any, componentFileNames: string[], importType: ImportType, allStylesheets: string[]): string[] {

    let imports = ["import { Component } from '@angular/core';"];

    if (bindings.data) {
        imports.push("import { HttpClient } from '@angular/common/http';");
    }

    if (importType === "packages") {
        addPackageImports(imports, bindings, allStylesheets);
    } else {
        addModuleImports(imports, bindings, allStylesheets);
    }

    if (componentFileNames) {
        imports.push(...componentFileNames.map(getImport));
    }

    addGenericInterfaceImport(imports, bindings.tData, bindings);

    return imports;
}

function getTemplate(bindings: any, attributes: string[]): string {
    const { gridSettings } = bindings;
    const style = gridSettings.noStyle ? '' : `style="width: ${gridSettings.width}; height: ${gridSettings.height};"`;

    const agGridTag = `<ag-grid-angular
    ${style}
    ${gridSettings.myGridReference ? 'id="myGrid"' : ''}
    ${attributes.join('\n    ')}
    ></ag-grid-angular>`;

    const template = bindings.template ? bindings.template.replace(templatePlaceholder, agGridTag) : agGridTag;

    return convertTemplate(template);
}

export function vanillaToAngular(bindings: any, componentFileNames: string[], allStylesheets: string[]): (importType: ImportType) => string {
    const { data, properties, typeDeclares, interfaces, tData } = bindings;
    const rowDataType = tData || 'any';
    const diParams = [];

    if (data) {
        diParams.push('private http: HttpClient');
    }

    const instanceMethods = bindings.instanceMethods.map(removeFunctionKeyword);


    const eventHandlers = bindings.eventHandlers.map(event => event.handler).map(removeFunctionKeyword);
    const externalEventHandlers = bindings.externalEventHandlers.map(handler => removeFunctionKeyword(handler.body));
    const genericParams = rowDataType !== 'any' ? `<${rowDataType}>` : ''

    return importType => {
        const imports = getImports(bindings, componentFileNames, importType, allStylesheets);
        const propertyAttributes = [];
        const propertyVars = [];
        const propertyAssignments = [];

        properties.filter(property => property.name !== 'onGridReady').forEach(property => {
            if (property.value === 'true' || property.value === 'false') {
                propertyAttributes.push(toConst(property));
            } else if (property.value === null || property.value === 'null') {
                propertyAttributes.push(toInput(property));
            } else {
                // for when binding a method
                // see javascript-grid-keyboard-navigation for an example
                // tabToNextCell needs to be bound to the angular component
                if (!isInstanceMethod(bindings.instanceMethods, property)) {
                    propertyAttributes.push(toInput(property));
                }

                propertyAssignments.push(toMemberWithValue(property));
            }
        });

        if (!propertyAttributes.find(item => item.indexOf('[rowData]') >= 0)) {
            propertyAttributes.push('[rowData]="rowData"');
        }

        if (!propertyAssignments.find(item => item.indexOf('rowData') >= 0)) {
            propertyAssignments.push(`public rowData!: ${rowDataType}[];`);
        }
        
        propertyAttributes.push('[class]="themeClass"');
        propertyAssignments.push(`public themeClass: string = ${getActiveTheme(bindings.gridSettings.theme, true)};`);

        const componentForCheckBody = eventHandlers
            .concat(externalEventHandlers)
            .concat(instanceMethods)
            .map(snippet => snippet.trim())
            .join('\n\n');

        const hasGridApi = componentForCheckBody.includes('gridApi');
        const gridReadyCode = getOnGridReadyCode(bindings.onGridReady, bindings.resizeToFit, data, rowDataType, hasGridApi, bindings.exampleName);
        const additional = [];

        if (gridReadyCode) {
            additional.push(gridReadyCode)
        }

        const eventAttributes = bindings.eventHandlers
            .filter(event => event.name !== 'onGridReady')
            .map(toOutput)
            .concat(gridReadyCode ? '(gridReady)="onGridReady($event)"' : '');

        const template = getTemplate(bindings, propertyAttributes.concat(eventAttributes));

        const componentBody = eventHandlers
            .concat(externalEventHandlers)
            .concat(additional)
            .concat(instanceMethods)
            .map(snippet => snippet.trim())
            .join('\n\n')
            // We do not need the non-null assertion in component code as already applied to the declaration for the apis.            
            .replace(/(?<!this.)gridApi(\??)(!?)/g, 'this.gridApi');

        let generatedOutput = `
${imports.join('\n')}
${bindings.gridSettings.licenseKey ? "// enter your license key here to suppress console message and watermark\nLicenseManager.setLicenseKey('');\n" : ''}
${typeDeclares?.length > 0 ? '\n' + typeDeclares.join('\n') : ''}${interfaces?.length > 0 ? '\n' + interfaces.join('\n') : ''}

@Component({
    selector: 'my-app',
    template: \`${template}\`
})

export class AppComponent {
${hasGridApi ? `    private gridApi!: GridApi${genericParams};\n` : ''}
    ${propertyVars.join('\n')}
    ${propertyAssignments.join(';\n')}

${diParams.length > 0 ?
            `    constructor(${diParams.join(', ')}) {
}

`: ''}
    ${componentBody}
}

${bindings.classes.join('\n')}

${bindings.utils.join('\n')}
`;

        // Until we support this cleanly.
        generatedOutput = handleRowGenericInterface(generatedOutput, tData);

        return generatedOutput;
    };
}

if (typeof window !== 'undefined') {
    (<any>window).vanillaToAngular = vanillaToAngular;
}

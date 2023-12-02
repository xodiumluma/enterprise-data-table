const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const fsExtra = require('fs-extra');
const { spawnSync } = require('child_process');

const moduleDirs = (grid, enterprise, packageName) => {
    const moduleName = `@ag-${grid ? 'grid' : 'charts'}-${enterprise ? 'enterprise' : 'community'}/${packageName}`;
    const moduleDirRoot = `${grid ? 'grid' : 'charts'}-${enterprise ? 'enterprise' : 'community'}-modules`;
    const moduleDir = `${moduleDirRoot}/${packageName}`;
    const exampleDir = undefined;

    return { moduleName, moduleDirRoot, moduleDir, exampleDir };
};

const readArgV = (flagName) => {
    if (process.argv.includes(flagName)) {
        return true;
    }
}

const readBooleanFlag = (trueValue, falseValue) => {
    if (readArgV(trueValue)) return true;
    if (falseValue && readArgV(falseValue)) return false;
    return undefined;
}

const readNonFlags = () => {
    return process.argv.slice(2).filter(v => !v.startsWith('--'));
}

const readFlags = () => {
    const grid = readBooleanFlag('--grid', '--charts');
    const enterprise = readBooleanFlag('--enterprise', '--community');
    const force = readBooleanFlag('--force');
    const packageName = readNonFlags()[0];

    if (grid != null && enterprise != null && packageName != null) {
        return { grid, enterprise, packageName, force };
    }
    return undefined;
}

const getRequiredInputs = async () => {
    const flags = readFlags();
    if (flags) {
        return flags;
    }

    const answers = await inquirer
        .prompt([
            {
                name: 'gridOrCharts',
                message: 'Will this be an [C]harts or [G]grid package [C|c/G|g]?',
            },
            {
                name: 'enterpriseOrCommunity',
                message: 'Will this be an [E]nterprise or [C]ommunity package [E|e/C|c]?',
            },
            {
                name: 'packageName',
                message: 'What is the module name (will become @ag-grid-community/[packageName] / @ag-grid-enterprise/[packageName]) ?',
            },
            {
                name: 'force',
                message: 'Overwrite existing module [y|N]?',
                when: async ({ packageName, gridOrCharts, enterpriseOrCommunity }) => {
                    const { moduleDir } = moduleDirs(
                        gridOrCharts.toLowerCase() === 'g',
                        enterpriseOrCommunity.toLowerCase() === 'e',
                        packageName,
                    );
                    console.log('Checking if exists: ', moduleDir);
                    return fs.existsSync(`./${moduleDir}`);
                },
            },
        ]);

    let grid = true;
    switch (answers.gridOrCharts.toLowerCase()) {
        case 'c':
            grid = false;
            break;
        case 'g':
            break;
        default:
            console.error(`!! Unknown value for package type: "${answers.gridOrCharts}". Please specify either "C" or "G"`);
            process.exit(1);
    }

    let enterprise = false;
    switch (answers.enterpriseOrCommunity.toLowerCase()) {
        case 'e':
            enterprise = true;
            break;
        case 'c':
            break;
        default:
            console.error(`!! Unknown value for package type: "${answers.enterpriseOrCommunity}". Please specify either "E" or "C"`);
            process.exit(1);
    }

    let force = false;
    if (answers.force && answers.force.toLowerCase() === 'y') {
        force = true;
    }

    return {grid, enterprise, packageName: answers.packageName, force};
};

const main = async () => {
    const {grid, enterprise, packageName, force} = await getRequiredInputs();

    const { moduleDir, moduleDirRoot, moduleName, exampleDir } = moduleDirs(grid, enterprise, packageName);

    if (fs.existsSync(`./${moduleDir}`)) {
        if (!force) {
            console.error(`${moduleDir} already exists - exiting.`);
            process.exit(1);
        }
    }

    const sourceVersionModule = `${grid ? 'core' : enterprise ? 'core' : 'ag-charts-community'}`
    const packageVersionNumber = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../${moduleDirRoot}/${sourceVersionModule}/package.json`), 'UTF-8')).version;
    const templatePackageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, path.resolve(__dirname, `./${grid ? 'grid' : 'charts'}-template.json`)), 'UTF-8'));

    templatePackageJson.name = moduleName;
    templatePackageJson.version = packageVersionNumber;
    templatePackageJson.license = enterprise ? 'Commercial' : 'MIT';
    templatePackageJson.dependencies[grid ? '@ag-grid-community/core' : 'ag-charts-community'] = `~${packageVersionNumber}`;
    if (enterprise) {
        templatePackageJson.dependencies[grid ? '@ag-grid-enterprise/core' : 'ag-charts-enterprise'] = `~${packageVersionNumber}`;
    }
    const templatePackageJsonLintStaged = templatePackageJson['lint-staged'];
    if (templatePackageJsonLintStaged) {
        for (const [pattern, cmd] of Object.entries(templatePackageJsonLintStaged)) {
            templatePackageJsonLintStaged[pattern] = cmd.replace('${moduleName}', moduleName);
            templatePackageJsonLintStaged[pattern] = cmd.replace('${packageName}', packageName);
        }
    }

    if (!fs.existsSync(`./${moduleDir}/src`)) {
        fs.mkdirSync(`./${moduleDir}/src`, { recursive: true });
    }

    const chartsPrefix = grid ? '' : 'charts-';
    fsExtra.copySync(path.resolve(__dirname, './.npmignore'), `./${moduleDir}/.npmignore`);
    fsExtra.copySync(path.resolve(__dirname, './.gitignore'), `./${moduleDir}/.gitignore`);
    fsExtra.copySync(path.resolve(__dirname, './tsconfig.cjs.es5.docs.json'), `./${moduleDir}/tsconfig.cjs.es5.docs.json`);
    fsExtra.copySync(path.resolve(__dirname, './tsconfig.cjs.es5.json'), `./${moduleDir}/tsconfig.cjs.es5.json`);
    fsExtra.copySync(path.resolve(__dirname, './tsconfig.cjs.es6.json'), `./${moduleDir}/tsconfig.cjs.es6.json`);
    fsExtra.copySync(path.resolve(__dirname, './tsconfig.esm.es5.json'), `./${moduleDir}/tsconfig.esm.es5.json`);
    fsExtra.copySync(path.resolve(__dirname, './tsconfig.esm.es6.json'), `./${moduleDir}/tsconfig.esm.es6.json`);
    fsExtra.copySync(path.resolve(__dirname, './tsconfig.test.json'), `./${moduleDir}/tsconfig.test.json`);
    fsExtra.copySync(path.resolve(__dirname, `./${chartsPrefix}jest.config.js`), `./${moduleDir}/jest.config.js`);
    fsExtra.copySync(path.resolve(__dirname, `./${chartsPrefix}main.ts`), `./${moduleDir}/src/main.ts`);
    fsExtra.copySync(path.resolve(__dirname, '../../grid-enterprise-modules/core/LICENSE.html'), `./${moduleDir}/LICENSE.html`);

    if (!grid) {
        fsExtra.copySync(path.resolve(__dirname, './.prettierrc'), `./${moduleDir}/.prettierrc`);
        fsExtra.copySync(path.resolve(__dirname, './.prettierignore'), `./${moduleDir}/.prettierignore`);
        fsExtra.copySync(path.resolve(__dirname, './charts-eslintrc.js'), `./${moduleDir}/.eslintrc.js`);
        fsExtra.copySync(path.resolve(__dirname, './charts-eslintignore'), `./${moduleDir}/.eslintignore`);
        fsExtra.copySync(path.resolve(__dirname, './charts-placeholder.test.ts'), `./${moduleDir}/src/placeholder.test.ts`);

        for (const tsconfig of fs.readdirSync(`./${moduleDir}/`).filter(p => p.startsWith('tsconfig.'))) {
            const filename = `./${moduleDir}/${tsconfig}`;
            const config = JSON.parse(fs.readFileSync(filename).toString());
            config.compilerOptions.strict = tsconfig.indexOf('.test.') < 0;
            config.compilerOptions.experimentalDecorators = true;
            fs.writeFileSync(filename, JSON.stringify(config));
        }

        fsExtra.copySync(path.resolve(__dirname, './charts-tsconfig.json'), `./${moduleDir}/tsconfig.json`);
    }

    fs.writeFileSync(`./${moduleDir}/package.json`, JSON.stringify(templatePackageJson, null, 4), 'UTF-8');

    if (exampleDir) {
        const examplePackageJsonPath = path.resolve(exampleDir, 'package.json');
        const examplePackageJson = JSON.parse(fs.readFileSync(examplePackageJsonPath), 'UTF-8');
        examplePackageJson.dependencies[moduleName] = `~${packageVersionNumber}`;
        fs.writeFileSync(examplePackageJsonPath, JSON.stringify(examplePackageJson, null, 4));
    }

    spawnSync('npx', `lerna bootstrap --include-dependents --include-dependencies --scope=${moduleName}`.split(' '), { stdio: 'inherit' });

    if (!grid) {
        spawnSync('npx', `prettier -w ./${moduleDir}/`.split(' '), { stdio: 'inherit' });
        spawnSync('npx', `lerna run build --scope=${moduleName}`.split(' '), { stdio: 'inherit' })
    }
};

main();

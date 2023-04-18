// Remount component when Fast Refresh is triggered
// @refresh reset

import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { createAutomatedRowGrouping } from '../../../components/automated-examples/examples/row-grouping';
import { OverlayButton } from '../../../components/automated-examples/OverlayButton';
import { ToggleAutomatedExampleButton } from '../../../components/automated-examples/ToggleAutomatedExampleButton';
import { UpdateSpeedSlider } from '../../../components/automated-examples/UpdateSpeedSlider';
import LogoMark from '../../../components/LogoMark';
import { isProductionBuild, localPrefix } from '../../../utils/consts';
import { useIntersectionObserver } from '../../../utils/use-intersection-observer';
import styles from './AutomatedRowGrouping.module.scss';

const EXAMPLE_ID = 'row-grouping';

const helmet = [];
if (!isProductionBuild()) {
    helmet.push(
        <link
            key="hero-grid-theme"
            rel="stylesheet"
            href={`${localPrefix}/@ag-grid-community/styles/ag-theme-alpine.css`}
            crossOrigin="anonymous"
            type="text/css"
        />
    );
    helmet.push(
        <script
            key="enterprise-lib"
            src={`${localPrefix}/@ag-grid-enterprise/all-modules/dist/ag-grid-enterprise.js`}
            type="text/javascript"
        />
    );
} else {
    helmet.push(
        <script
            key="enterprise-lib"
            src="https://cdn.jsdelivr.net/npm/ag-grid-enterprise/dist/ag-grid-enterprise.min.js"
            type="text/javascript"
        />
    );
}

function AutomatedRowGrouping({
    automatedExampleManager,
    scriptDebuggerManager,
    useStaticData,
    runOnce,
    visibilityThreshold,
}) {
    const gridClassname = 'automated-row-grouping-grid';
    const gridRef = useRef(null);
    const exampleRef = useRef(null);
    const [scriptIsEnabled, setScriptIsEnabled] = useState(true);
    const [gridIsReady, setGridIsReady] = useState(false);
    const [gridIsHoveredOver, setGridIsHoveredOver] = useState(false);
    const [frequency, setFrequency] = useState(1);

    const setAllScriptEnabledVars = (isEnabled) => {
        setScriptIsEnabled(isEnabled);
        automatedExampleManager.setEnabled({ id: EXAMPLE_ID, isEnabled });
    };
    const updateFrequency = useCallback((value) => {
        if (!exampleRef.current) {
            return;
        }
        exampleRef.current.setUpdateFrequency(value);
        setFrequency(value);
    }, []);

    useIntersectionObserver({
        elementRef: gridRef,
        onChange: ({ isIntersecting }) => {
            if (isIntersecting) {
                automatedExampleManager.start(EXAMPLE_ID);
            } else {
                automatedExampleManager.inactive(EXAMPLE_ID);
            }
        },
        threshold: visibilityThreshold,
        isDisabled: !gridIsReady,
    });

    useEffect(() => {
        let params = {
            gridClassname,
            mouseMaskClassname: styles.mouseMask,
            scriptDebuggerManager,
            suppressUpdates: useStaticData,
            useStaticData,
            runOnce,
            onStateChange(state) {
                // Catch errors, and allow the user to use the grid
                if (state === 'stopping') {
                    setAllScriptEnabledVars(false);
                }
            },
            onGridReady() {
                setGridIsReady(true);
            },
            visibilityThreshold,
        };

        exampleRef.current = createAutomatedRowGrouping(params);
        automatedExampleManager.add({
            id: EXAMPLE_ID,
            automatedExample: exampleRef.current,
        });
    }, []);

    return (
        <>
            <header className={styles.sectionHeader}>
                <h2 className="font-size-gargantuan">Feature Packed, Incredible Performance</h2>
                <p className="font-size-large">
                    All the features your users expect and more. Out of the box performance that can handle any data you
                    can throw&nbsp;at&nbsp;it.
                </p>
            </header>

            <Helmet>{helmet.map((entry) => entry)}</Helmet>
            <div ref={gridRef} className="automated-row-grouping-grid ag-theme-alpine-dark">
                <OverlayButton
                    ariaLabel="Give me control"
                    isHidden={!scriptIsEnabled}
                    onPointerEnter={() => setGridIsHoveredOver(true)}
                    onPointerOut={() => setGridIsHoveredOver(false)}
                    onClick={() => {
                        setAllScriptEnabledVars(false);
                        automatedExampleManager.stop(EXAMPLE_ID);
                    }}
                />
                {!gridIsReady && !useStaticData && <LogoMark isSpinning />}
            </div>

            <footer className={styles.sectionFooter}>
                <div className={classNames(styles.exploreButtonOuter, 'font-size-large')}>
                    <span className="text-secondary">Live example:</span>
                    <ToggleAutomatedExampleButton
                        onClick={() => {
                            if (scriptIsEnabled) {
                                setAllScriptEnabledVars(false);
                                automatedExampleManager.stop(EXAMPLE_ID);
                            } else {
                                setAllScriptEnabledVars(true);
                                automatedExampleManager.start(EXAMPLE_ID);
                            }
                        }}
                        isHoveredOver={gridIsHoveredOver}
                        scriptIsActive={scriptIsEnabled}
                    ></ToggleAutomatedExampleButton>
                </div>

                <UpdateSpeedSlider
                    min={0.1}
                    max={4}
                    step={0.1}
                    value={frequency}
                    disabled={!gridIsReady}
                    setValue={updateFrequency}
                />
            </footer>
        </>
    );
}

export default AutomatedRowGrouping;

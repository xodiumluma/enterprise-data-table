import React, { memo, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BeansContext } from '../beansContext';
import { AgPromise, HeaderFilterCellCtrl, IFloatingFilter, IHeaderFilterCellComp, UserCompDetails } from '@ag-grid-community/core';
import { CssClasses, isComponentStateless } from '../utils';
import { showJsComp } from '../jsComp';

const HeaderFilterCellComp = (props: {ctrl: HeaderFilterCellCtrl}) => {

    const {context} = useContext(BeansContext);

    const [cssClasses, setCssClasses] = useState<CssClasses>(() => new CssClasses('ag-header-cell', 'ag-floating-filter'));
    const [cssBodyClasses, setBodyCssClasses] = useState<CssClasses>(() => new CssClasses());
    const [cssButtonWrapperClasses, setButtonWrapperCssClasses] = useState<CssClasses>(() => new CssClasses('ag-floating-filter-button', 'ag-hidden'));
    const [buttonWrapperAriaHidden, setButtonWrapperAriaHidden] = useState<"true" | "false">("false");
    const [userCompDetails, setUserCompDetails] = useState<UserCompDetails | null>();

    const eGui = useRef<HTMLDivElement | null>(null);
    const eFloatingFilterBody = useRef<HTMLDivElement>(null);
    const eButtonWrapper = useRef<HTMLDivElement>(null);
    const eButtonShowMainFilter = useRef<HTMLButtonElement>(null);

    const userCompResolve = useRef<(value: IFloatingFilter)=>void>();  
    const userCompPromise = useRef<AgPromise<IFloatingFilter>>();
    
    const userCompRef = (value: IFloatingFilter) => {

        // We skip when it's un-setting
        if (value == null) {
            return;
        }

        userCompResolve.current && userCompResolve.current(value);
    };

    const { ctrl } = props;

    const setRef = useCallback((e: HTMLDivElement) => {
        eGui.current = e;
        if (!eGui.current) {
            return;
        }

        userCompPromise.current = new AgPromise<IFloatingFilter>(resolve => {
            userCompResolve.current = resolve;
        });

        const compProxy: IHeaderFilterCellComp = {
            addOrRemoveCssClass: (name, on) => setCssClasses(prev => prev.setClass(name, on)),
            addOrRemoveBodyCssClass: (name, on) => setBodyCssClasses(prev => prev.setClass(name, on)),
            setButtonWrapperDisplayed: (displayed) => {
                setButtonWrapperCssClasses(prev => prev.setClass('ag-hidden', !displayed))
                setButtonWrapperAriaHidden(!displayed ? "true" : "false");
            },
            setWidth: width => {
                if (eGui.current) {
                    eGui.current.style.width = width;
                }
            },
            setCompDetails: compDetails => setUserCompDetails(compDetails),
            getFloatingFilterComp: ()=> userCompPromise.current ? userCompPromise.current :  null,
            setMenuIcon: eIcon => eButtonShowMainFilter.current?.appendChild(eIcon)
        };

        ctrl.setComp(compProxy, eGui.current, eButtonShowMainFilter.current!, eFloatingFilterBody.current!);

    }, []);


    // js comps
    useLayoutEffect(() => showJsComp(userCompDetails, context, eFloatingFilterBody.current!, userCompRef), [userCompDetails]);

    const className = useMemo(() => cssClasses.toString(), [cssClasses] );
    const bodyClassName = useMemo(() => cssBodyClasses.toString(), [cssBodyClasses] );
    const buttonWrapperClassName = useMemo(() => cssButtonWrapperClasses.toString(), [cssButtonWrapperClasses] );

    const userCompStateless = useMemo(() => {
        const res = userCompDetails 
                    && userCompDetails.componentFromFramework 
                    && isComponentStateless(userCompDetails.componentClass);
        return !!res;
    }, [userCompDetails]);

    const reactUserComp = userCompDetails && userCompDetails.componentFromFramework;
    const UserCompClass = userCompDetails && userCompDetails.componentClass;

    return (
        <div ref={setRef} className={className} role="gridcell" tabIndex={-1}>
            <div ref={eFloatingFilterBody} className={bodyClassName} role="presentation">
                { reactUserComp && userCompStateless && <UserCompClass { ...userCompDetails!.params } /> }
                { reactUserComp && !userCompStateless && <UserCompClass { ...userCompDetails!.params } ref={ userCompRef }/> }
            </div>
            <div ref={eButtonWrapper} aria-hidden={buttonWrapperAriaHidden} className={buttonWrapperClassName} role="presentation">
                <button ref={eButtonShowMainFilter} type="button" className="ag-button ag-floating-filter-button-button" tabIndex={-1}></button>
            </div>
        </div>
    );
};

export default memo(HeaderFilterCellComp);
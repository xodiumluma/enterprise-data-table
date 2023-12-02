/**
 * The file gatsby-ssr.js lets you alter the content of static HTML files as they are being Server-Side Rendered (SSR)
 * by Gatsby and Node.js.
 * https://www.gatsbyjs.com/docs/reference/config-files/gatsby-ssr
 */

import React from 'react';
import {withPrefix} from 'gatsby';
import {Helmet} from 'react-helmet';
import {dependencies} from './package.json';
import {siteMetadata} from './gatsby-config';
import isDevelopment from './src/utils/is-development';
import {isProductionBuild} from "./src/utils/consts";

const PLAUSIBLE_DOMAIN = isProductionBuild()
    ? 'ag-grid.com'
    : 'testing.ag-grid.com';

/**
 * This allows to customise the rendering of the body. We insert some scripts at the end of the body. It is better to
 * pull these files directly from a CDN rather than bundling them ourselves. However, the Node packages are still
 * required to be installed as they are used elsewhere, so we import the versions here to ensure we are consistent.
 */
export const onRenderBody = ({setPostBodyComponents}) => {
    setPostBodyComponents([
        <script
            key="jquery"
            src={`https://cdnjs.cloudflare.com/ajax/libs/jquery/${dependencies['jquery']}/jquery.slim.min.js`}
            crossOrigin="anonymous"/>,
        <script
            key="bootstrap"
            src={`https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/${dependencies['bootstrap']}/js/bootstrap.bundle.min.js`}
            crossOrigin="anonymous"/>,
        <script
            key="smooth-scroll"
            src="https://cdnjs.cloudflare.com/ajax/libs/smooth-scroll/16.1.3/smooth-scroll.polyfills.min.js"
            crossOrigin="anonymous"/>,

        // This initialises the smooth scrolling when clicking hash links
        // Gets scroll offset from the `--scroll-offset` CSS custom property set for :root
        <script key="initialise-smooth-scroll" dangerouslySetInnerHTML={{
            __html: `
            var scrollOffsetCustomProp = () => {return window.getComputedStyle(document.body).getPropertyValue('--scroll-offset')};

            var scroll = new SmoothScroll(
                'a[href*="#"]',
                {
                    speed: 200,
                    speedAsDuration: true,
                    offset: function() { 
                        return scrollOffsetCustomProp() ? Number(scrollOffsetCustomProp().replace('px', '')) : 40; 
                    }
                });`
        }}/>,
    ]);
};

/**
 * This allows us to wrap the page element. We use this to add a canonical URL for each page through React Helmet.
 */
export const wrapPageElement = ({element, props: {location: {pathname}}}) => {
    if (['/example-runner/', '/404/', '/404.html'].some(exclude => withPrefix(exclude) === pathname)) {
        return element;
    }

    const canonicalUrl = `${siteMetadata.siteUrl}${pathname || '/'}`;

    return (
        <>
            <Helmet link={[{rel: 'canonical', key: canonicalUrl, href: canonicalUrl}]}/>
            {element}
        </>
    );
};

/**
 * This allows us to customise the page before it is rendered.
 */
export const onPreRenderHTML = ({ getHeadComponents, replaceHeadComponents, pathname }) => {
    // Remove script that causes issues with scroll position when a page is first loaded
    const headComponents = getHeadComponents().filter(el => el.key !== 'gatsby-remark-autolink-headers-script');

    if (process.env.NODE_ENV === 'production') {
        // Gatsby inlines CSS by default, to minimise the number of requests, and since after one page is loaded
        // every other navigation is through JS, so you would only load it once. However, SEO optimisers see a big page
        // size, and it's not many more requests, so we remove inlined CSS, and just load it from the file instead
        headComponents.forEach(el => {
            if (el.type === 'style' && el.props['data-href']) {
                el.type = 'link';
                el.props['href'] = el.props['data-href'];
                el.props['rel'] = 'stylesheet';
                el.props['type'] = 'text/css';

                delete el.props['data-href'];
                delete el.props['dangerouslySetInnerHTML'];
            }
        });
    }

    // for anything other that www.ag-grid.com
    if (!isProductionBuild()) {
        headComponents.unshift(<meta
            key="robots-noindex"
            name="robots"
            content="noindex"/>)
    }

    // Ensure these styles are loaded before ours
    headComponents.unshift(<link
        key="roboto"
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.1.0/index.min.css"
        crossOrigin="anonymous"/>,
    );
    headComponents.unshift(<link
        key="plex"
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;700&display=swap"
        crossOrigin="anonymous"/>,
    );

    // Add Plausible.io tracking
    if (!isDevelopment()) {
        headComponents.unshift(
            <>
                <script defer data-domain={PLAUSIBLE_DOMAIN} src="https://plausible.io/js/script.tagged-events.outbound-links.js"></script>
                <script>{`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`}</script>
            </>
        );
    }

    replaceHeadComponents(headComponents);
};

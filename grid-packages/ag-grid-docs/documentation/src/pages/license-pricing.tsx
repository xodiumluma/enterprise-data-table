import classnames from 'classnames';
import ukraineFlagSVG from 'images/ukraine-flag.svg';
import React, { useEffect } from 'react';
import { Icon } from '../components/Icon';
import { InfoEmailLink } from '../components/InfoEmailLink';
import { Licenses } from '../components/licenses/Licenses';
import NPMIcon from '../images/inline-svgs/npm.svg';
import { trackOnceInfoEmail } from '../utils/analytics';
import { hostPrefix } from '../utils/consts';
import SEO from './components/SEO';
// @ts-ignore
import styles from './license-pricing.module.scss';

export const LicensePricing = () => {
    useEffect(() => {
        const onSelectionChange = () => {
            const selection = document.getSelection()?.toString();
            if (selection?.includes('info@ag-grid.com')) {
                trackOnceInfoEmail({
                    type: 'selectedEmail',
                });
            }
        };
        document.addEventListener('selectionchange', onSelectionChange);

        return () => {
            document.removeEventListener('selectionchange', onSelectionChange);
        };
    });

    return (
        <div className={classnames('page-margin', styles.container)}>
            <div className={styles.topSection}>
                <div className={styles.intro}>
                    <h1>AG Grid Licences</h1>

                    <p className="font-size-large">
                        Email
                        <InfoEmailLink
                            emailSubject="AG Grid Developer license query"
                            trackingType="headerLink"
                        >
                            info@ag-grid.com
                        </InfoEmailLink>{' '}
                        and start a conversation. We can provide quotes, give bulk pricing, and answer any sales or
                        contract-related questions you may have.
                    </p>

                    <p className={styles.salesEmail}>
                        <InfoEmailLink isButton withIcon className="font-size-extra-large" trackingType="headerButton">
                            info@ag-grid.com
                        </InfoEmailLink>
                    </p>

                    <div className={styles.videoPrompt}>
                        <a href="#video-explainer" className={styles.thumbnail}>
                            <img
                                src="https://img.youtube.com/vi/xacx_attYuo/hqdefault.jpg"
                                alt="AG Grid license explained video"
                            />
                        </a>

                        <div>
                            <h3>Which licenses do I need?</h3>
                            <p>
                                <a href="#video-explainer">
                                    <span className="icon"></span>
                                    Watch our short explainer video
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                <div className={styles.licensesOuter}>
                    <Licenses />

                    <p className={styles.buyTogether}>
                        <div className={styles.buyTogetherInner}>
                            <div className={styles.left}>
                                <p className={styles.products}>
                                    <b>AG&nbsp;Grid</b> +<wbr /> <b>AG&nbsp;Charts</b>
                                </p>
                                <div className={classnames(styles.enterpriseProducts, 'font-size-small')}>
                                    <p>
                                        AG Grid Enterprise <Icon name="enterprise" />
                                    </p>
                                    <p>
                                        AG Charts Enterprise <Icon name="enterprise" />
                                    </p>
                                </div>

                                <p className="font-size-small">The Ultimate Grid and Charts Combination</p>
                            </div>

                            <div className={styles.right}>
                                <div className={styles.rightInner}>
                                    <div className={styles.rightPrice}>
                                        <p className="font-size-small">Starting at...</p>
                                        <p className={styles.price}>$1,198</p>
                                        <p className="font-size-small">Per Developer</p>
                                    </div>
                                    <div className={styles.rightInfo}>
                                        <p className="font-size-small">Perpetual License</p>
                                        <p className="font-size-small">1 Year of Support</p>
                                        <p className="font-size-small">1 Year of Updates</p>
                                    </div>
                                </div>

                                <a
                                    href="https://ag-grid.com/ecommerce/#/ecommerce/?licenseType=single&productType=both"
                                    target='_parent'
                                    className="button button-secondary"
                                >
                                    Configure Now
                                </a>
                            </div>
                        </div>
                    </p>
                </div>
            </div>

            <div className={styles.communityEnterprise}>
                <div className={styles.community}>
                    <h3>Community Versions</h3>
                    <p>
                        <a href="https://www.npmjs.com/package/ag-grid-community" target='_parent'><b>AG Grid Community</b></a> and <a href="https://www.npmjs.com/package/ag-charts-community" target='_parent'><b>AG Charts Community</b></a> are free and open source products distributed under the{' '}
                        <a href="https://www.ag-grid.com/eula/AG-Grid-Community-License.html" target="_blank">
                            MIT License
                        </a>
                        . These versions are free to use in production environments.
                    </p>

                    <a
                        href="https://www.npmjs.com/package/ag-grid-community"
                        target='_parent'
                        className={classnames(styles.NpmButton, 'button-secondary')}
                    >
                        <NPMIcon /> Get AG Grid Community at NPM
                    </a>
                    <br />
                    <a
                        href="https://www.npmjs.com/package/ag-charts-community"
                        target='_parent'
                        className={classnames(styles.NpmButton, 'button-secondary')}
                    >
                        <NPMIcon /> Get AG Charts Community at NPM
                    </a>
                </div>

                <div className={styles.enterprise}>
                    <h3>
                        Enterprise Versions <Icon name="enterprise" />
                    </h3>
                    <p>
                        <a href="https://ag-grid.com/javascript-data-grid/licensing/" target='_parent'><b>AG Grid Enterprise</b></a> and <a href="https://charts.ag-grid.com/javascript/licensing/" target='_parent'><b>AG Charts Enterprise</b></a> are commercial products distributed
                        under our{' '}
                        <a href="https://www.ag-grid.com/eula/AG-Grid-Enterprise-License-Latest.html" target="_blank">
                            EULA
                        </a>{' '}
                        and supported by our technical staff.
                    </p>

                    <p>
                        To evaluate <a href="https://ag-grid.com/javascript-data-grid/licensing/" target='_parent'><b>AG Grid Enterprise</b></a> or <a href="https://charts.ag-grid.com/javascript/licensing/" target='_parent'><b>AG Charts Enterprise</b></a> you don't need our
                        permission – all features are unlocked. To temporarily hide the watermark and browser console
                        errors e-mail us to{' '}
                        <InfoEmailLink
                            emailSubject="AG Grid Trial license request"
                            trackingType="enterpriseEvaluationKey"
                        >
                            get a temporary evaluation key
                        </InfoEmailLink>
                        .
                    </p>

                    <p>
                        Once you're ready to begin development, please purchase an appropriate license key from the
                        options above.
                    </p>

                    <p>
                        Expanded definitions are available further down the page. For any other questions please{' '}
                        <InfoEmailLink
                            emailSubject="AG Grid Developer license query"
                            trackingType="enterpriseGetInContact"
                        >
                            get in contact
                        </InfoEmailLink>
                        .
                    </p>

                    <a
                        href={`${hostPrefix}/javascript-data-grid/licensing/#feature-comparison`}
                        className="button-secondary"
                        target='_parent'
                    >
                        See all AG Grid Enterprise features
                    </a>
                    <br/>
                    <a
                        href="https://charts.ag-grid.com/react/licensing/#feature-comparison"
                        className="button-secondary"
                        target='_parent'
                    >
                        See all AG Charts Enterprise features
                    </a>
                </div>
            </div>

            <div className={styles.ukraineNotice}>
                <img src={ukraineFlagSVG} alt="flag of Ukraine" />

                <p className="text-secondary font-size-small">
                    In light of current events in Ukraine we are choosing to express our disappointment in the breakdown
                    of diplomacy, and its effects on the people of Ukraine, the global economy and community by not
                    licensing software to companies or individuals registered or residing in the Russian Federation.
                </p>
            </div>

            <div className={styles.videoExplainer} id="video-explainer">
                <div>
                    <h3 className="font-size-massive">Questions about our licenses? </h3>
                    <p>
                        Watch our short video for an in-depth look at exactly how the license works. Learn which license
                        is right for you, how many licenses you need for your team, and exactly when you need a
                        deployment license.
                    </p>
                    <p>
                        If you have any other questions, or want to investigate volume pricing please{' '}
                        <InfoEmailLink
                            emailSubject="AG Grid Developer license query"
                            trackingType="questionsGetInContact"
                        >
                            get in contact
                        </InfoEmailLink>
                        .
                    </p>
                </div>

                <iframe
                    src="https://www.youtube.com/embed/xacx_attYuo"
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>

            <div className={styles.licensesInDetail}>
                <h3 className="font-size-massive">Our Licenses in Depth</h3>

                <div
                    className={classnames(styles.singleApplicationLicense, 'card', 'single-application')}
                    id="single-application"
                >
                    <header>
                        <h3>Single Application Development License</h3>
                    </header>
                    <div className="content">
                        <p>
                            Licenses one application, developed for internal use, to embed AG Grid Enterprise and / or
                            AG Charts Enterprise in perpetuity.
                        </p>
                        <ul>
                            <li>Includes a 1-year subscription to new versions, support and maintenance.</li>
                            <li>For customer-facing applications you will also need a Deployment License add-on.</li>
                            <li>
                                All concurrent, front-end, JavaScript developers working on the Application would need
                                to be added to the license count, not just the ones working with AG Grid and / or AG
                                Charts.
                            </li>
                            <li>
                                Developers within the Single Application Development License count are unnamed, so long
                                as the total licensed count isn’t exceeded.
                            </li>
                            <li>
                                Single Application Development Licenses are bound to an application name and can’t be
                                reused on other applications.
                            </li>
                        </ul>
                    </div>
                </div>

                <div
                    className={classnames(styles.multipleApplicationsLicense, 'card', 'multiple-application')}
                    id="multiple-application"
                >
                    <header>
                        <h3>Multiple Application Development License</h3>
                    </header>
                    <div className="content">
                        <p>
                            Licenses unlimited number of applications, developed for internal use, to embed AG Grid
                            Enterprise and / or AG Charts Enterprise in perpetuity.
                        </p>
                        <ul>
                            <li>Includes a 1-year subscription to new versions, support and maintenance.</li>
                            <li>For customer-facing applications you will also need a Deployment License add-on.</li>
                            <li>
                                All concurrent, front-end, JavaScript developers working across the licensed
                                Applications would need to be added to the license count, not just the ones working with
                                AG Grid and / or AG Charts.
                            </li>
                            <li>
                                Developers within the Multiple Application Development License count are unnamed, so
                                long as the total licensed count isn’t exceeded.
                            </li>
                        </ul>
                    </div>
                </div>

                <div className={classnames(styles.deploymentLicense, 'card')} id="deployment">
                    <header>
                        <h3>Deployment License Add-on</h3>
                    </header>
                    <div className="content">
                        <p>
                            Allows licensed developers to sub-license AG Grid and / or AG Charts for one application on
                            one production environment in perpetuity. Includes a 1-year subscription to new versions,
                            support and maintenance. Only available with a Developer License.
                        </p>
                        <ul>
                            <li>
                                A Deployment License Add-on allows making a project available to individuals (eg your
                                customers) outside of your organisation (sub-license).
                            </li>
                            <li>One Deployment License Add-on covers one production environment for one project.</li>
                            <li>
                                Only production environments require licensing. All other environments (eg development,
                                test, pre-production) do not require a license.
                            </li>
                            <li>
                                We do not charge per server. A cluster of many servers part of one application
                                installation is considered one deployment and requires one Deployment License. This is
                                true so long as the application instances within the cluster are replicas of each other
                                and server provides load balancing and fail over only.
                            </li>
                            <li>
                                Production failover deployments do not need to be licensed separately. They are
                                considered part of the overall application production deployment.
                            </li>
                            <li>
                                Multi-tenant deployments, where one application instance is serving many customers over
                                different URLs, is considered one deployment, as each tenant is getting serviced by the
                                same application instance.
                            </li>
                            <li>
                                Different instances of the same application, where the instances are not part of a
                                cluster for fail over or load balancing, are considered independent deployments and need
                                a Deployment License for each individual application instance.
                            </li>
                            <li>
                                Deploying an application to a cloud service (eg AWS or Docker) requires one Deployment
                                License, regardless of how many virtual containers or servers the cloud application
                                spawns for that one single instance of the application.
                            </li>
                        </ul>

                        <p>
                            If you have a deployment that doesn't fit within our licensing model, please{' '}
                            <InfoEmailLink emailSubject="AG Grid Developer license query" trackingType="deployment">
                                start a conversation with us
                            </InfoEmailLink>{' '}
                            and we will do our best to get to something that works.
                        </p>
                    </div>
                </div>
            </div>

            <div className={styles.contactSales}>
                <p className="text-secondary">
                    For any enquires about bulk pricing, questions on which license is right for you, or any other
                    license related questions please contact our friendly sales team.{' '}
                </p>

                <InfoEmailLink
                    emailSubject="AG Grid Developer license query"
                    className="font-size-extra-large"
                    trackingType="footer"
                >
                    info@ag-grid.com
                </InfoEmailLink>
            </div>
        </div>
    );
};

const LicensePricingPage = () => {
    return (
        <>
            <SEO
                title="AG Grid: License and Pricing"
                description="AG Grid is a feature-rich datagrid available in Community or Enterprise versions. This page describes the License and Pricing details for AG Grid Enterprise."
            />
            <LicensePricing />
        </>
    );
};

export default LicensePricingPage;

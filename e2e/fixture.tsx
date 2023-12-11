/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { test as base, expect } from '@playwright/test';
import { Page } from 'playwright';
import { 
    createTabster, 
    disposeTabster, 
    getCrossOrigin, 
    getDeloser, 
    getGroupper, 
    getModalizer,
    getMover,
    getObservedElement,
    getOutline,
    getRestorer,
    getTabster, 
    getTabsterAttribute,
    makeNoOp,
    mergeTabsterProps,
    setTabsterAttribute,
    Types as TabsterTypes
 } from "tabster";

export interface TabsterTestVariables {
    disposeTabster?: typeof disposeTabster;
    createTabster?: typeof createTabster;
    getTabster?: typeof getTabster;
    getCrossOrigin?: typeof getCrossOrigin;
    getDeloser?: typeof getDeloser;
    getGroupper?: typeof getGroupper;
    getModalizer?: typeof getModalizer;
    getMover?: typeof getMover;
    getRestorer?: typeof getRestorer;
    getObservedElement?: typeof getObservedElement;
    getOutline?: typeof getOutline;
    makeNoOp?: typeof makeNoOp;
    getTabsterAttribute?: typeof getTabsterAttribute;
    setTabsterAttribute?: typeof setTabsterAttribute;
    mergeTabsterProps?: typeof mergeTabsterProps;
    core?: TabsterTypes.Tabster;
    modalizer?: TabsterTypes.ModalizerAPI;
    deloser?: TabsterTypes.DeloserAPI;
    outline?: TabsterTypes.OutlineAPI;
    mover?: TabsterTypes.MoverAPI;
    groupper?: TabsterTypes.GroupperAPI;
    observedElement?: TabsterTypes.ObservedElementAPI;
    crossOrigin?: TabsterTypes.CrossOriginAPI;
};

export interface WindowWithTabsterCoreAndFocusState extends Window {
    __tabsterFocusedRoot?: {
        events: {
            elementId?: string;
            type: "focus" | "blur";
            fromAdjacent?: boolean;
        }[];
    };

    getTabsterTestVariables: () => TabsterTestVariables;
}

type TabsterParts = Partial<{
    modalizer: boolean;
    deloser: boolean;
    outline: boolean;
    mover: boolean;
    groupper: boolean;
    observed: boolean;
    crossOrigin: boolean;
    restorer: boolean;
}>;

type TabsterFixtures = {
    tabsterParts: TabsterParts;
    tabsterPage: TabsterPage;
    controlled: boolean;
}

let _lastRnd = 0;

class TabsterPage {

    private _page: Page;

    constructor(page: Page) {
        this._page = page;
    }

    public get page(): Page {
        return this._page;
    }

    public async goto(parts: TabsterParts): Promise<void> {

        const testPageUrl = this._getTestPageURL(parts);
        console.log("testPageUrl", testPageUrl);
        await this._page.goto(testPageUrl);
        await expect(this._page).toHaveTitle("Tabster Test");

        await this._page.evaluate(async () => {
            return new Promise((resolve) => {
                setTimeout(check, 10);

                function check() {
                    // eslint-disable-next-line
                    // @ts-ignore
                    if (typeof getTabsterTestVariables !== "undefined") {
                        resolve(true);
                    } else {
                        setTimeout(check, 10);
                    }
                }
            });
        });
    }

    public async renderJsx(jsx: React.ReactElement): Promise<void> {
        return this.renderHtmlString(renderToStaticMarkup(jsx));
    }

    public async renderHtmlString(html: string): Promise<void> {
        return await this._page.evaluate(async (html) => {
            document.body.innerHTML = html;
        }, html);
    }

    public async activeElementProperty(property: keyof Element): Promise<any | null> {
        return await this._page.evaluate(async (prop) => {
            const ae = document.activeElement;
            if (!ae) {
                return null;
            }
            return ae[prop];
        }, property);
    }

    public async activeElementAttribute(attribute: string): Promise<string | null> {
        return await this._page.evaluate(async (attr) => {
            const ae = document.activeElement;
            if (!ae) {
                return null;
            }

            return ae.getAttribute(attr);
        }, attribute);
    }

    public async pressTab(): Promise<void> {
        return await this._page.keyboard.press("Tab");
    }

    public async pressShiftTab(): Promise<void> {
        return await this._page.keyboard.press("Shift+Tab");
    }

    public async pressEnter(): Promise<void> {
        return await this._page.keyboard.press("Enter");
    }

    public async removeElement(selector?: string, async = false) {
        return await this._page.evaluate(([ selector, async ]: [ string, boolean ]) => {
            const el = selector
                ? document.querySelector(selector)
                : document.activeElement;

            if (el && el.parentElement) {
                if (async) {
                    setTimeout(
                        () => el.parentElement?.removeChild(el),
                        0
                    );
                } else {
                    el.parentElement.removeChild(el);
                }
            }
        }, [ selector || "", async ]);
    }

    public async wait(duration: number): Promise<true> {
        return new Promise((resolve) => {
            setTimeout(() => resolve(true), duration);
        });
    }

    private _getTestPageURL(parts: TabsterParts): string {

        const port = parseInt(process.env.PORT || "0", 10) || 3000;
        const controlTab = !process.env.STORYBOOK_UNCONTROLLED;
        const rootDummyInputs = !!process.env.STORYBOOK_ROOT_DUMMY_INPUTS;
        return `http://localhost:${port}/?controlTab=${controlTab}&rootDummyInputs=${rootDummyInputs}${
            parts
                ? `&parts=${Object.keys(parts)
                      .filter((part: keyof TabsterParts) => parts[part])
                      .join(",")}`
                : ""
        }&rnd=${++_lastRnd}`;
    }
}


export const test = base.extend<TabsterFixtures>({

    tabsterParts: {},

    tabsterPage: async ({ page }, use) => {

        const tabsterPage = new TabsterPage(page);
        await use(tabsterPage);
    },

    controlled: !(process.env.STORYBOOK_UNCONTROLLED || process.env.STORYBOOK_ROOT_DUMMY_INPUTS),
})
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { test as base, expect } from '@playwright/test';
import { Page } from 'playwright';

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

    public async pressTab(): Promise<void> {
        return await this._page.keyboard.press("Tab");
    }

    public async pressShiftTab(): Promise<void> {
        return await this._page.keyboard.press("Shift+Tab");
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
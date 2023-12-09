/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as React from "react";
import { expect } from '@playwright/test';
import { test } from './fixture';
import { getTabsterAttribute, Types as TabsterTypes } from "tabster";
// import * as BroTest from "./utils/BroTest";
// import { itIfControlled } from "./utils/test-utils";

interface WindowWithTabsterCoreAndFocusState extends Window {
    __tabsterFocusedRoot?: {
        events: {
            elementId?: string;
            type: "focus" | "blur";
            fromAdjacent?: boolean;
        }[];
    };
}

test.beforeEach(async ({ tabsterPage }) => {
    await tabsterPage.goto({});
});

test("should insert dummy inputs as first and last children", async ({ tabsterPage, controlled }) => {
    test.skip(controlled === false, "Skipping when uncontrolled");

    await tabsterPage.renderJsx(
        (
            <div id="root" {...getTabsterAttribute({ root: {} })}>
                <button>Button</button>
            </div> 
        )
    );

    const page = tabsterPage.page;

    const dummyCount = await page.evaluate((dummayAttribute) => {
        return document.querySelectorAll(`[${dummayAttribute}]`).length;
    }, TabsterTypes.TabsterDummyInputAttributeName);

    expect(dummyCount).toEqual(2);

    const areFirstAndLast = await page.evaluate((dummyAttribute) => {
        const first = document
            .getElementById("root")
            ?.children[0].hasAttribute(dummyAttribute);
        const second = document
            .getElementById("root")
            ?.children[2].hasAttribute(dummyAttribute);
        return first && second;
    }, TabsterTypes.TabsterDummyInputAttributeName);

    expect(areFirstAndLast).toEqual(true);
});

test("should allow to go outside of the application when tabbing forward", async ({ tabsterPage }) => {
    await tabsterPage.renderJsx(
        (
            <div {...getTabsterAttribute({ root: {} })}>
                <button>Button1</button>
                <button>Button2</button>
                <button>Button3</button>
            </div>
        )
    );

    await tabsterPage.pressTab();
    expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button1");

    await tabsterPage.pressTab();
    expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button2");

    await tabsterPage.pressTab();
    expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button3");

    await tabsterPage.pressTab();
    expect(await tabsterPage.activeElementProperty('tagName')).toEqual('BODY');
});

test("should allow to go outside of the application when tabbing backwards", async ({ tabsterPage }) => {

    await tabsterPage.renderJsx(
        (
            <div {...getTabsterAttribute({ root: {} })}>
                <button>Button1</button>
                <button>Button2</button>
                <button>Button3</button>
            </div>
        )
    );

    await tabsterPage.pressTab();
    expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button1");

    await tabsterPage.pressTab();
    expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button2");
            
    await tabsterPage.pressTab();
    expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button3");

    await tabsterPage.pressShiftTab();
    expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button2");

    await tabsterPage.pressShiftTab();
    expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button1");

    await tabsterPage.pressShiftTab();
    expect(await tabsterPage.activeElementProperty('tagName')).toEqual("BODY");
            
    await tabsterPage.pressTab();
    expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button1");
});

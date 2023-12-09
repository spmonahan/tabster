/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as React from "react";
import { expect } from '@playwright/test';
import { test } from './fixture';
import { getTabsterAttribute, Types as TabsterTypes } from "tabster";
import type { WindowWithTabsterCoreAndFocusState } from "./fixture";

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

test("should trigger root focus events", async ({ tabsterPage }) => {

    await tabsterPage.renderJsx(
        (
            <div id="root" {...getTabsterAttribute({ root: {} })}>
                <button id="button1">Button1</button>
                <button>Button2</button>
            </div>
        )
    );

    const page = tabsterPage.page;

    await page.evaluate(() => {
        const win = window as unknown as WindowWithTabsterCoreAndFocusState;

        const focusedRoot: WindowWithTabsterCoreAndFocusState["__tabsterFocusedRoot"] =
            (win.__tabsterFocusedRoot = {
                events: [],
            });

        const tabster = win.getTabsterTestVariables().core;

        tabster?.root.eventTarget.addEventListener(
            "focus",
            (
                e: TabsterTypes.TabsterEventWithDetails<TabsterTypes.RootFocusEventDetails>
            ) => {
                if (e.details.element.id) {
                    focusedRoot.events.push({
                        elementId: e.details.element.id,
                        type: "focus",
                    });
                }
            }
        );

        tabster?.root.eventTarget.addEventListener(
            "blur",
            (
                e: TabsterTypes.TabsterEventWithDetails<TabsterTypes.RootFocusEventDetails>
            ) => {
                if (e.details.element.id) {
                    focusedRoot.events.push({
                        elementId: e.details.element.id,
                        type: "blur",
                    });
                }
            }
        ); 
    });

    await tabsterPage.pressTab();
    expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button1");

    let __tabsterFocusedRoot = await page.evaluate(() => {
        return (window as unknown as WindowWithTabsterCoreAndFocusState).__tabsterFocusedRoot;
    });

    expect(__tabsterFocusedRoot).toEqual({
        events: [
            {
                elementId: "root",
                type: "focus",
            },
        ],
    });

    await tabsterPage.pressTab();
    expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button2");

    await tabsterPage.pressTab();
    expect(await tabsterPage.activeElementProperty('tagName')).toEqual("BODY");

    __tabsterFocusedRoot = await page.evaluate(() => {
        return (window as unknown as WindowWithTabsterCoreAndFocusState).__tabsterFocusedRoot;
    });

    expect(__tabsterFocusedRoot).toEqual({
        events: [
            {
                elementId: "root",
                type: "focus",
            },
            {
                elementId: "root",
                type: "blur",
            },
        ],
    });

    await tabsterPage.pressShiftTab();
    expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button2");

    __tabsterFocusedRoot = await page.evaluate(() => {
        return (window as unknown as WindowWithTabsterCoreAndFocusState).__tabsterFocusedRoot;
    });

    expect(__tabsterFocusedRoot).toEqual({
        events: [
            {
                elementId: "root",
                type: "focus",
            },
            {
                elementId: "root",
                type: "blur",
            },
            {
                elementId: "root",
                type: "focus",
            },
        ],
    });

    await tabsterPage.pressShiftTab();
    expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button1");
    await tabsterPage.pressShiftTab();

    __tabsterFocusedRoot = await page.evaluate(() => {
        return (window as unknown as WindowWithTabsterCoreAndFocusState).__tabsterFocusedRoot;
    });

    expect(__tabsterFocusedRoot).toEqual({
        events: [
            {
                elementId: "root",
                type: "focus",
            },
            {
                elementId: "root",
                type: "blur",
            },
            {
                elementId: "root",
                type: "focus",
            },
            {
                elementId: "root",
                type: "blur",
            },
        ],
    });

    __tabsterFocusedRoot = await page.evaluate(() => {
        document.getElementById("button1")?.focus();
        return (window as unknown as WindowWithTabsterCoreAndFocusState).__tabsterFocusedRoot;
    });

    expect(__tabsterFocusedRoot).toEqual({
        events: [
            {
                elementId: "root",
                type: "focus",
            },
            {
                elementId: "root",
                type: "blur",
            },
            {
                elementId: "root",
                type: "focus",
            },
            {
                elementId: "root",
                type: "blur",
            },
            {
                elementId: "root",
                type: "focus",
            },
        ],
    });

});
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as React from "react";
import { expect } from '@playwright/test';
import { test } from './fixture';
import type { WindowWithTabsterCoreAndFocusState } from "./fixture";
import { getTabsterAttribute, Types as TabsterTypes } from "tabster";

test.describe("Deloser", () => {
    test.beforeEach(async ({ tabsterPage }) => {
        await tabsterPage.goto({ deloser: true, groupper: true });
    });
    
    test("should restore focus", async ({ tabsterPage }) => {
        await tabsterPage.renderJsx(
            (
                <div {...getTabsterAttribute({ root: {}, deloser: {} })}>
                    <button>Button1</button>
                    <button>Button2</button>
                    <button>Button3</button>
                    <button>Button4</button>
                </div>
            )
        );
    
        await tabsterPage.pressTab();
        await tabsterPage.pressTab();
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button2");
    
        await tabsterPage.removeElement();
        await tabsterPage.wait(300);
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button3");
    });
    
    test("should not restore focus if focus is not inside the deloser", async ({ tabsterPage }) => {
        await tabsterPage.renderJsx(
            (
                <div {...getTabsterAttribute({ root: {} })}>
                    <div {...getTabsterAttribute({ deloser: {} })}>
                        <button>Button1</button>
                    </div>
                    <button>Button2</button>
                </div>
            )
        );
    
        await tabsterPage.pressTab();
        await tabsterPage.pressTab();
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button2");
    
        await tabsterPage.removeElement();
        await tabsterPage.wait(300);
        expect(await tabsterPage.activeElementProperty('tagName')).toEqual("BODY");
    });
    
    test("should not restore focus by deloser history", async ({ tabsterPage }) => {
        await tabsterPage.renderJsx(
            (
                <div {...getTabsterAttribute({ root: {} })}>
                    <button {...getTabsterAttribute({ deloser: {} })}>
                        Button1
                    </button>
                    <button {...getTabsterAttribute({ deloser: {} })}>
                        Button2
                    </button>
                </div>
            )
        );
    
        await tabsterPage.pressTab();
        await tabsterPage.pressTab();
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button2");
    
        await tabsterPage.removeElement();
        await tabsterPage.wait(300);
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button1");
    });
    
    test("should be activated immediately if focus is inside", async ({ tabsterPage }) => {
        const tabsterAttr = getTabsterAttribute(
            {
                deloser: {},
            },
            true
        ) as string;
    
        await tabsterPage.renderJsx(
            (
                <div {...getTabsterAttribute({ root: {} })}>
                    <button {...getTabsterAttribute({ deloser: {} })}>
                        Button1
                    </button>
                    <button id="newDeloser">Button2</button>
                </div>
            )
        )
    
        await tabsterPage.pressTab();
        await tabsterPage.pressTab();
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button2");
    
        const page = tabsterPage.page;
    
        await page.evaluate(([ attrName, tabsterAttr ]) => {
            const newDeloser = document.getElementById("newDeloser");
            newDeloser?.setAttribute(attrName, tabsterAttr);
        }, [ TabsterTypes.TabsterAttributeName, tabsterAttr ]);
    
        await tabsterPage.removeElement("#newDeloser");
        await tabsterPage.wait(300);
    
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button1");
    });
    
    test("should restore focus in the middle of a limited groupper", async ({ tabsterPage }) => {
        await tabsterPage.renderJsx(
            (
                <div {...getTabsterAttribute({ root: {}, deloser: {} })}>
                    <div
                        tabIndex={0}
                        {...getTabsterAttribute({
                            groupper: {
                                tabbability:
                                    TabsterTypes.GroupperTabbabilities
                                        .LimitedTrapFocus,
                            },
                        })}
                    >
                        <button>Button1</button>
                        <button>Button2</button>
                        <button>Button3</button>
                    </div>
                    <div
                        tabIndex={0}
                        {...getTabsterAttribute({
                            groupper: {
                                tabbability:
                                TabsterTypes.GroupperTabbabilities
                                        .LimitedTrapFocus,
                            },
                        })}
                    >
                        <button className="button-4">Button4</button>
                        <button className="button-5">Button5</button>
                        <button className="button-6">Button6</button>
                    </div>
                </div>
            )
        );
        
        await tabsterPage.pressTab()
        await tabsterPage.pressTab()
    
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button4Button5Button6");
    
        await tabsterPage.pressEnter();
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button4");
    
        await tabsterPage.pressTab();
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button5");
        
        await tabsterPage.removeElement();
        await tabsterPage.wait(300);
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button4");
    });
    
    test("should restore focus in <form> with named inputs", async ({ tabsterPage }) => {
        await tabsterPage.renderJsx(
            (
                <form {...getTabsterAttribute({ root: {}, deloser: {} })}>
                    <button>Button1</button>
                    <input name="id" />
                    <button>Button2</button>
                </form>
            )
        );
        
        await tabsterPage.pressTab();
        await tabsterPage.pressTab();
        expect(await tabsterPage.activeElementAttribute('name')).toEqual("id");
    
        await tabsterPage.removeElement();
        await tabsterPage.wait(300);
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button1");
    });
});

test.describe("Deloser created lazily", () => {

    test.beforeEach(async ({ tabsterPage }) => {
        await tabsterPage.goto({ deloser: true, groupper: true });
    });

    test("should add currently focused element to the Deloser history if Deloser is created after the focus", async ({ tabsterPage }) => {
        await tabsterPage.renderJsx(
            (
                <div {...getTabsterAttribute({ root: {} })}>
                    <div>
                        <button
                            id="button1"
                            {...getTabsterAttribute({ deloser: {} })}
                        >
                            Button1
                        </button>
                    </div>
                    <div id="second">
                        <button
                            id="button2"
                            {...getTabsterAttribute({ deloser: {} })}
                        >
                            Button2
                        </button>
                    </div>
                </div>
            )
        );
        
        await tabsterPage.pressTab();
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button1");
            
        const page = tabsterPage.page;    
        
        await page.evaluate(() => {
            const win = window as unknown as WindowWithTabsterCoreAndFocusState;

            const vars = win.getTabsterTestVariables();
            const tabster = vars.createTabster?.(window);

            if (tabster) {
                vars.getDeloser?.(tabster);
            }
        });

        await tabsterPage.pressTab();
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button2");
            
        await page.evaluate(() => {
            const el = document.getElementById("second");
            el?.parentElement?.removeChild(el);
        });

        await tabsterPage.wait(500);
        expect(await tabsterPage.activeElementProperty('textContent')).toEqual("Button1");
    });

});

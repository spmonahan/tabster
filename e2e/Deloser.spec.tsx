/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as React from "react";
import { expect } from '@playwright/test';
import { test } from './fixture';
// import type { WindowWithTabsterCoreAndFocusState } from "./fixture";
import { getTabsterAttribute, Types as TabsterTypes } from "tabster";

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
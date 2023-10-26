/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as React from "react";
import { getTabsterAttribute, Types } from "tabster";
import * as BroTest from "./utils/BroTest";

describe("Deloser (shadow DOM)", () => {
    beforeEach(async () => {
        await BroTest.bootstrapTabsterPage({ deloser: true, groupper: true });
    });

    it("should restore focus", async () => {
        await new BroTest.BroTest(
            (
                <x-container id="container" {...getTabsterAttribute({ root: {}, deloser: {} })}>
                    <button>Button1</button>
                    <button>Button2</button>
                    <button>Button3</button>
                    <button>Button4</button>
                </x-container>
            )
        )
        .activeElement((el) => {
            console.log('el0', el);
            console.log(el ? el.tag : "WTF?");
        })
            .pressTab()
            .activeElement((el) => {
                console.log('el', el);
                console.log(el ? el.tag : "WTF?");
            })
            .pressTab()
            .activeElement((el) => {
                console.log('el2', el);
                expect(el?.textContent).toEqual("Button2");
            })
            .removeElement()
            .wait(300)
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button3");
            });
    });

    xit("should not restore focus if focus is not inside the deloser", async () => {
        await new BroTest.BroTest(
            (
                <x-container {...getTabsterAttribute({ root: {} })}>
                    <div {...getTabsterAttribute({ deloser: {} })}>
                        <button>Button1</button>
                    </div>
                    <button>Button2</button>
                </x-container>
            )
        )
            .pressTab()
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button2");
            })
            .removeElement()
            .wait(300)
            .activeElement((el) => {
                expect(el?.textContent).toBeUndefined();
            });
    });

    xit("should not restore focus by deloser history", async () => {
        await new BroTest.BroTest(
            (
                <x-container {...getTabsterAttribute({ root: {} })}>
                    <button {...getTabsterAttribute({ deloser: {} })}>
                        Button1
                    </button>
                    <button {...getTabsterAttribute({ deloser: {} })}>
                        Button2
                    </button>
                </x-container>
            )
        )
            .pressTab()
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button2");
            })
            .removeElement()
            .wait(300)
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button1");
            });
    });

    xit("should be activated immediately if focus is inside", async () => {
        const tabsterAttr = getTabsterAttribute(
            {
                deloser: {},
            },
            true
        ) as string;
        await new BroTest.BroTest(
            (
                <x-container {...getTabsterAttribute({ root: {} })}>
                    <button {...getTabsterAttribute({ deloser: {} })}>
                        Button1
                    </button>
                    <button id="newDeloser">Button2</button>
                </x-container>
            )
        )
            .pressTab()
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button2");
            })
            .eval(
                (attrName, tabsterAttr) => {
                    const newDeloser = document.getElementById("newDeloser");
                    newDeloser?.setAttribute(attrName, tabsterAttr);
                },
                Types.TabsterAttributeName,
                tabsterAttr
            )
            .removeElement("#newDeloser")
            .wait(300)
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button1");
            });
    });

    xit("should restore focus in the middle of a limited groupper", async () => {
        await new BroTest.BroTest(
            (
                <x-container {...getTabsterAttribute({ root: {}, deloser: {} })}>
                    <div
                        tabIndex={0}
                        {...getTabsterAttribute({
                            groupper: {
                                tabbability:
                                    Types.GroupperTabbabilities
                                        .LimitedTrapFocus,
                            },
                        })}
                    >
                        <button>Button1</button>
                        <button>Button2</button>
                        <button>Button3</button>
                    </div>
                    <x-container
                        tabIndex={0}
                        {...getTabsterAttribute({
                            groupper: {
                                tabbability:
                                    Types.GroupperTabbabilities
                                        .LimitedTrapFocus,
                            },
                        })}
                    >
                        <button className="button-4">Button4</button>
                        <button className="button-5">Button5</button>
                        <button className="button-6">Button6</button>
                    </x-container>
                </x-container>
            )
        )
            .pressTab()
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button4Button5Button6");
            })
            .pressEnter()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button4");
            })
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button5");
            })
            .removeElement()
            .wait(300)
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button4");
            });
    });

    xit("should restore focus in <form> with named inputs", async () => {
        await new BroTest.BroTest(
            (
                <x-container>
                    <form {...getTabsterAttribute({ root: {}, deloser: {} })}>
                        <button>Button1</button>
                        <input name="id" />
                        <button>Button2</button>
                    </form>
                </x-container>
            )
        )
            .pressTab()
            .pressTab()
            .activeElement((el) => {
                expect(el?.attributes.name).toEqual("id");
            })
            .removeElement()
            .wait(300)
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button1");
            });
    });
});

xdescribe("Deloser created lazily", () => {
    beforeEach(async () => {
        await BroTest.bootstrapTabsterPage();
    });

    it("should add currently focused element to the Deloser history if Deloser is created after the focus", async () => {
        await new BroTest.BroTest(
            (
                <x-container {...getTabsterAttribute({ root: {} })}>
                    <x-container>
                        <button
                            id="button1"
                            {...getTabsterAttribute({ deloser: {} })}
                        >
                            Button1
                        </button>
                    </x-container>
                    <x-container id="second">
                        <button
                            id="button2"
                            {...getTabsterAttribute({ deloser: {} })}
                        >
                            Button2
                        </button>
                    </x-container>
                </x-container>
            )
        )
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button1");
            })
            .eval(() => {
                const vars = getTabsterTestVariables();
                const tabster = vars.createTabster?.(window);

                if (tabster) {
                    vars.getDeloser?.(tabster);
                }
            })
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button2");
            })
            .eval(() => {
                const el = document.getElementById("second");
                el?.parentElement?.removeChild(el);
            })
            .wait(500)
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button1");
            });
    });
});

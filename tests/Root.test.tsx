/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as React from "react";
import { getTabsterAttribute, Types as TabsterTypes } from "tabster";
import * as BroTest from "./utils/BroTest";
import { itIfControlled } from "./utils/test-utils";

interface WindowWithTabsterCoreAndFocusState extends Window {
    __tabsterFocusedRoot?: {
        events: {
            elementId?: string;
            type: "focus" | "blur";
        }[];
    };
}

describe("Root", () => {
    beforeEach(async () => {
        await BroTest.bootstrapTabsterPage({});
    });

    itIfControlled(
        "should insert dummy inputs as first and last children",
        async () => {
            await new BroTest.BroTest(
                (
                    <div id="root" {...getTabsterAttribute({ root: {} })}>
                        <button>Button</button>
                    </div>
                )
            )
                .eval((dummyAttribute) => {
                    return document.querySelectorAll(`[${dummyAttribute}]`)
                        .length;
                }, TabsterTypes.TabsterDummyInputAttributeName)
                .check((dummyCount: number) => {
                    expect(dummyCount).toBe(2);
                })
                .eval((dummyAttribute) => {
                    const first = document
                        .getElementById("root")
                        ?.children[0].hasAttribute(dummyAttribute);
                    const second = document
                        .getElementById("root")
                        ?.children[2].hasAttribute(dummyAttribute);
                    return first && second;
                }, TabsterTypes.TabsterDummyInputAttributeName)
                .check((areFirstAndLast: boolean) => {
                    expect(areFirstAndLast).toBe(true);
                });
        }
    );

    it("should allow to go outside of the application when tabbing forward", async () => {
        await new BroTest.BroTest(
            (
                <div {...getTabsterAttribute({ root: {} })}>
                    <button>Button1</button>
                    <button>Button2</button>
                    <button>Button3</button>
                </div>
            )
        )
            .wait(1000)
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button1");
            })
            .wait(1000)
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button2");
            })
            .wait(1000)
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button3");
            })
            .wait(10000)
            .pressTab()
            .debug()
            .activeElement((el) => {
                expect(el?.tag).toEqual("body");
            });
    });

    it("should allow to go outside of the application when tabbing backwards", async () => {
        await new BroTest.BroTest(
            (
                <div {...getTabsterAttribute({ root: {} })}>
                    <button>Button1</button>
                    <button>Button2</button>
                    <button>Button3</button>
                </div>
            )
        )
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button1");
            })
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button2");
            })
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button3");
            })
            .pressTab(true)
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button2");
            })
            .pressTab(true)
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button1");
            })
            .pressTab(true)
            .activeElement((el) => {
                expect(el?.tag).toEqual("body");
            })
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button1");
            });
    });

    it("should trigger root focus events", async () => {
        await new BroTest.BroTest(
            (
                <div id="root" {...getTabsterAttribute({ root: {} })}>
                    <button id="button1">Button1</button>
                    <button>Button2</button>
                </div>
            )
        )
            .eval(() => {
                const win =
                    window as unknown as WindowWithTabsterCoreAndFocusState;

                const focusedRoot: WindowWithTabsterCoreAndFocusState["__tabsterFocusedRoot"] =
                    (win.__tabsterFocusedRoot = {
                        events: [],
                    });

                const tabster = getTabsterTestVariables().core;

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
            })
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button1");
            })
            .eval(() => {
                return (window as unknown as WindowWithTabsterCoreAndFocusState)
                    .__tabsterFocusedRoot;
            })
            .check(
                (
                    res: WindowWithTabsterCoreAndFocusState["__tabsterFocusedRoot"]
                ) => {
                    expect(res).toEqual({
                        events: [
                            {
                                elementId: "root",
                                type: "focus",
                            },
                        ],
                    });
                }
            )
            .pressTab()
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button2");
            })
            .pressTab()
            .activeElement((el) => {
                expect(el?.tag).toEqual("body");
            })
            .eval(() => {
                return (window as unknown as WindowWithTabsterCoreAndFocusState)
                    .__tabsterFocusedRoot;
            })
            .check(
                (
                    res: WindowWithTabsterCoreAndFocusState["__tabsterFocusedRoot"]
                ) => {
                    expect(res).toEqual({
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
                }
            )
            .pressTab(true)
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button2");
            })
            .eval(() => {
                return (window as unknown as WindowWithTabsterCoreAndFocusState)
                    .__tabsterFocusedRoot;
            })
            .check(
                (
                    res: WindowWithTabsterCoreAndFocusState["__tabsterFocusedRoot"]
                ) => {
                    expect(res).toEqual({
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
                }
            )
            .pressTab(true)
            .activeElement((el) => {
                expect(el?.textContent).toEqual("Button1");
            })
            .pressTab(true)
            .eval(() => {
                return (window as unknown as WindowWithTabsterCoreAndFocusState)
                    .__tabsterFocusedRoot;
            })
            .check(
                (
                    res: WindowWithTabsterCoreAndFocusState["__tabsterFocusedRoot"]
                ) => {
                    expect(res).toEqual({
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
                }
            )
            .eval(() => {
                document.getElementById("button1")?.focus();
                return (window as unknown as WindowWithTabsterCoreAndFocusState)
                    .__tabsterFocusedRoot;
            })
            .check(
                (
                    res: WindowWithTabsterCoreAndFocusState["__tabsterFocusedRoot"]
                ) => {
                    expect(res).toEqual({
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
                }
            );
    });
});

/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import "./groupper.css";
import { getTabsterAttribute, Types as TabsterTypes } from "tabster";

export type FocusableContainerProps = TabsterTypes.GroupperProps;

const styles = new CSSStyleSheet();
styles.insertRule(':host { border: 2px solid orange; display: block;');

class XContainer extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: "open", delegatesFocus: true });
        const slot = document.createElement("slot");
        slot.id = "slot-id";
        const div = document.createElement("div");
        div.id = "div-id";
        div.appendChild(slot);
        this.shadowRoot.appendChild(div);

        this.shadowRoot.adoptedStyleSheets = [styles];
    }
}

if (!window.customElements.get("x-container")) {
    window.customElements.define("x-container", XContainer);
}


export const createFocusableContainer = (props: FocusableContainerProps) => {
    const { tabbability } = props;

    const wrapper = document.createElement("div");
    wrapper.tabIndex = 0;
    wrapper.classList.add("item");

    const attr = getTabsterAttribute(
        {
            groupper: {
                tabbability,
            },
        },
        true
    );

    wrapper.setAttribute(TabsterTypes.TabsterAttributeName, attr);

    wrapper.innerHTML = `
    <x-container id="sentinal">
    <button id="btn1">Focusable button</button>
    <button id="btn2">Focusable button</button>
    </x-container>
  `;

    return wrapper;
};

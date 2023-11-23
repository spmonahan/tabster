/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { hasShadowRoot, hasSlottedChildren } from "../ShadowDomTreeWalker/utils";

export function getParent(node: HTMLElement | Node | null | undefined): HTMLElement | null {
    if (!node) {
        return null;
    }
// return node.parentElement;
    if (typeof (node as HTMLSlotElement).assignedElements !== 'function' && (node as HTMLElement).assignedSlot?.parentNode) {
        // Element is slotted
        return (node as HTMLElement).assignedSlot as HTMLElement;
    } else if (node.parentNode?.nodeType === 11) { // DOCUMENT_FRAGMENT
        // Element is in shadow root
        return (node.parentNode as ShadowRoot).host as HTMLElement;
    } else {
        return node.parentElement;
    }
}

export function getSlotParent(node: HTMLElement | Node): HTMLElement | null {
    return (node as HTMLElement).assignedSlot ?? null;
}

export function getShadowParent(node: HTMLElement | Node): HTMLElement | null {
    const root: Document | ShadowRoot = node.getRootNode() as Document | ShadowRoot;

    if (root.nodeType === 11) { // DOCUMENT_FRAGMENT (ShadowRoot)
        return (root as ShadowRoot).host as HTMLElement;
    }

    return null;
}

export function getShadowOrSlotParent(node: HTMLElement | Node): HTMLElement | null {
    const slotParent = getSlotParent(node);
    if (slotParent) {
        return slotParent;
    }

    return getShadowParent(node);
}

export function getLastChildWithShadowAndSlot(container: HTMLElement): HTMLElement | undefined {

    let lastChild: HTMLElement | null = container.lastElementChild as HTMLElement;
    while (lastChild) {
        if (hasShadowRoot(lastChild)) {
            lastChild = lastChild.shadowRoot?.lastElementChild as HTMLElement;
        } else if (hasSlottedChildren(lastChild)) {
            lastChild = (lastChild as HTMLSlotElement).assignedElements().at(-1) as HTMLElement;
        } else {
            lastChild = lastChild.lastElementChild as HTMLElement;
        }
    }

    return lastChild || undefined;

}
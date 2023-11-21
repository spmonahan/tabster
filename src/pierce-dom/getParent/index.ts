/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export function getParent(node: HTMLElement | Node | null | undefined): HTMLElement | null {
    if (!node) {
        return null;
    }
return node.parentElement;
    // if (typeof (node as HTMLSlotElement).assignedElements !== 'function' && (node as HTMLElement).assignedSlot?.parentNode) {
    //     // Element is slotted
    //     return (node as HTMLElement).assignedSlot as HTMLElement;
    // } else if (node.parentNode?.nodeType === 11) { // DOCUMENT_FRAGMENT
    //     // Element is in shadow root
    //     return (node.parentNode as ShadowRoot).host as HTMLElement;
    // } else {
    //     return node.parentElement;
    // }
}
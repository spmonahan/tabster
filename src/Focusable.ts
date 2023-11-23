/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { getTabsterOnElement } from "./Instance";
import { RootAPI } from "./Root";
import * as Types from "./Types";
import {
    createElementTreeWalker,
    getLastChild,
    matchesSelector,
    shouldIgnoreFocus,
    HTMLElementWithDummyContainer,
    elementContains,
} from "./Utils";
import { delegatesFocus, hasSlottedChildren } from "./pierce-dom/ShadowDomTreeWalker/utils";
import { getParent } from "./pierce-dom/getParent";

const _focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "*[tabindex]",
    "*[contenteditable]",
].join(", ");

export class FocusableAPI implements Types.FocusableAPI {
    private _tabster: Types.TabsterCore;

    constructor(tabster: Types.TabsterCore) {
        this._tabster = tabster;
    }

    dispose(): void {
        /**/
    }

    getProps(element: HTMLElement): Types.FocusableProps {
        const tabsterOnElement = getTabsterOnElement(this._tabster, element);
        return (tabsterOnElement && tabsterOnElement.focusable) || {};
    }

    isFocusable(
        el: HTMLElement,
        includeProgrammaticallyFocusable?: boolean,
        noVisibleCheck?: boolean,
        noAccessibleCheck?: boolean
    ): boolean {
        if (
            matchesSelector(el, _focusableSelector) &&
            (includeProgrammaticallyFocusable || el.tabIndex !== -1)
        ) {
            return (
                (noVisibleCheck || this.isVisible(el)) &&
                (noAccessibleCheck || this.isAccessible(el))
            );
        }

        return false;
    }

    isVisible(el: HTMLElement): boolean {
        if (!el.ownerDocument || el.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }

        if (el.offsetParent === null && el.ownerDocument.body !== el) {
            return false;
        }

        const win = el.ownerDocument.defaultView;

        if (!win) {
            return false;
        }

        const rect = el.ownerDocument.body.getBoundingClientRect();

        if (rect.width === 0 && rect.height === 0) {
            // This might happen, for example, if our <body> is in hidden <iframe>.
            return false;
        }

        const computedStyle = win.getComputedStyle(el);

        if (computedStyle.visibility === "hidden") {
            return false;
        }

        return true;
    }

    isAccessible(el: HTMLElement): boolean {
        // for (let e: HTMLElement | null = el; e; e = e.parentElement) {
        for (let e: HTMLElement | null = el; e; e = getParent(e)) {
            const tabsterOnElement = getTabsterOnElement(this._tabster, e);

            if (this._isHidden(e)) {
                return false;
            }

            const ignoreDisabled =
                tabsterOnElement?.focusable?.ignoreAriaDisabled;

            if (!ignoreDisabled && this._isDisabled(e)) {
                return false;
            }
        }

        return true;
    }

    private _isDisabled(el: HTMLElement): boolean {
        return el.hasAttribute("disabled");
    }

    private _isHidden(el: HTMLElement): boolean {
        const attrVal = el.getAttribute("aria-hidden");

        if (attrVal && attrVal.toLowerCase() === "true") {
            if (!this._tabster.modalizer?.isAugmented(el)) {
                return true;
            }
        }

        return false;
    }

    findFirst(options: Types.FindFirstProps): HTMLElement | null | undefined {
        return this.findElement({
            ...options,
        });
    }

    findLast(options: Types.FindFirstProps): HTMLElement | null | undefined {
        return this.findElement({
            isBackward: true,
            ...options,
        });
    }

    findNext(
        options: Types.FindNextProps,
        out?: Types.FindFocusableOutputProps
    ): HTMLElement | null | undefined {
        return this.findElement({ ...options }, out);
    }

    findPrev(
        options: Types.FindNextProps,
        out?: Types.FindFocusableOutputProps
    ): HTMLElement | null | undefined {
        return this.findElement({ ...options, isBackward: true }, out);
    }

    findDefault(options: Types.FindDefaultProps): HTMLElement | null {
        return (
            this.findElement({
                ...options,
                acceptCondition: (el) =>
                    this._tabster.focusable.isFocusable(
                        el,
                        options.includeProgrammaticallyFocusable
                    ) && !!this.getProps(el).isDefault,
            }) || null
        );
    }

    findAll(options: Types.FindAllProps): HTMLElement[] {
        return this._findElements(true, options) || [];
    }

    findElement(
        options: Types.FindFocusableProps,
        out?: Types.FindFocusableOutputProps
    ): HTMLElement | null | undefined {
        const found = this._findElements(false, options, out);
        return found ? found[0] : found;
    }

    private _findElements(
        findAll: boolean,
        options: Types.FindFocusableProps,
        out?: Types.FindFocusableOutputProps
    ): HTMLElement[] | null | undefined {
        const {
            container,
            currentElement = null,
            includeProgrammaticallyFocusable,
            useActiveModalizer,
            ignoreUncontrolled,
            ignoreAccessibility,
            modalizerId,
            isBackward,
            onUncontrolled,
            onElement,
        } = options;

        if (!out) {
            out = {};
        }

        const elements: HTMLElement[] = [];

        let { acceptCondition } = options;

        if (!container) {
            return null;
        }

        if (!acceptCondition) {
            acceptCondition = (el) => {
                const f = this._tabster.focusable.isFocusable(
                    el,
                    includeProgrammaticallyFocusable,
                    false,
                    ignoreAccessibility
                );
                return f;
            }
        }

        const acceptElementState: Types.FocusableAcceptElementState = {
            container,
            modalizerUserId:
                modalizerId === undefined && useActiveModalizer
                    ? this._tabster.modalizer?.activeId
                    : modalizerId ||
                      RootAPI.getTabsterContext(this._tabster, container)
                          ?.modalizer?.userId,
            from: currentElement || container,
            isBackward,
            acceptCondition,
            includeProgrammaticallyFocusable,
            ignoreUncontrolled,
            ignoreAccessibility,
            cachedGrouppers: {},
        };

        const walker = createElementTreeWalker(
            container.ownerDocument,
            container,
            (node) =>
                this._acceptElement(node as HTMLElement, acceptElementState)
        );

        if (!walker) {
            return null;
        }

        const prepareForNextElement = (
            shouldContinueIfNotFound?: boolean
        ): boolean => {
            const foundElement = acceptElementState.foundElement;

            if (foundElement) {
                elements.push(foundElement);
            }

            if (findAll) {
                if (foundElement) {
                    acceptElementState.found = false;
                    delete acceptElementState.foundElement;
                    delete acceptElementState.fromCtx;
                    acceptElementState.from = foundElement;

                    if (onElement && !onElement(foundElement)) {
                        return false;
                    }
                }

                return !!(foundElement || shouldContinueIfNotFound);
            } else {
                const reval = !!(shouldContinueIfNotFound && !foundElement);
                return reval;
            }
        };

        if (!currentElement) {
            out.outOfDOMOrder = true;
        }

        if (currentElement) {
            walker.currentNode = currentElement;
        } else if (isBackward) {
            const lastChild = getLastChild(container);

            if (!lastChild) {
                return null;
            }

            if (
                this._acceptElement(lastChild, acceptElementState) ===
                    NodeFilter.FILTER_ACCEPT &&
                !prepareForNextElement(true)
            ) {
                if (acceptElementState.skippedFocusable) {
                    out.outOfDOMOrder = true;
                }

                return elements;
            }

            walker.currentNode = lastChild;
        }

        let foundElement: HTMLElement | null | undefined;
        do {
            foundElement =
                ((isBackward
                    ? walker.previousNode()
                    : walker.nextNode()) as HTMLElement | null) || undefined;

            // if (foundElement && delegatesFocus(foundElement)) {
            //     foundElement =
            //         ((isBackward
            //             ? walker.previousNode()
            //             : walker.nextNode()) as HTMLElement | null) || undefined;
            // }

        } while (prepareForNextElement());

        if (!findAll) {
            const nextUncontrolled = acceptElementState.nextUncontrolled;

            if (nextUncontrolled) {
                if (onUncontrolled) {
                    onUncontrolled(nextUncontrolled);
                }

                if (foundElement) {
                    // We have an uncontrolled area and there is a controlled element after it.
                    // Return undefined for the default Tab action.
                    return undefined;
                } else {
                    // Otherwise, return null to moveOutWithDefaultAction().
                    return null;
                }
            }
        }

        if (acceptElementState.skippedFocusable) {
            out.outOfDOMOrder = true;
        }

        return elements.length ? elements : null;
    }

    private _acceptElement(
        element: HTMLElement,
        state: Types.FocusableAcceptElementState
    ): number {
        if (state.found) {
            return NodeFilter.FILTER_ACCEPT;
        }

        const container = state.container;

        if (element === container) {
            return NodeFilter.FILTER_SKIP;
        }

        // if (!container.contains(element)) {
        if (!elementContains(container, element)) {
            return NodeFilter.FILTER_REJECT;
        }

        if (
            (element as HTMLElementWithDummyContainer).__tabsterDummyContainer
        ) {
            return NodeFilter.FILTER_REJECT;
        }

        let lastToIgnore = state.lastToIgnore;

        if (lastToIgnore) {
            // if (lastToIgnore.contains(element)) {
            if (elementContains(lastToIgnore, element)) {
                return NodeFilter.FILTER_REJECT;
            } else {
                lastToIgnore = state.lastToIgnore = undefined;
            }
        }
        
        const ctx = (state.currentCtx = RootAPI.getTabsterContext(
            this._tabster,
            element
        ));

        // Tabster is opt in, if it is not managed, don't try and get do anything special
        if (!ctx) {
            return NodeFilter.FILTER_SKIP;
        }

        if (state.ignoreUncontrolled) {
            if (shouldIgnoreFocus(element)) {
                return NodeFilter.FILTER_SKIP;
            }
        } else if (
            ctx.uncontrolled &&
            !state.nextUncontrolled &&
            this._tabster.focusable.isFocusable(element, undefined, true, true)
        ) { 
            if (!ctx.groupper && !ctx.mover) {
                if (
                    ctx.modalizer?.userId === this._tabster.modalizer?.activeId
                ) {
                    if (this.isVisible(ctx.uncontrolled)) {
                        state.nextUncontrolled = ctx.uncontrolled;
                    }

                    state.skippedFocusable = true;

                    return NodeFilter.FILTER_REJECT;
                }
            }
        }

        // We assume iframes are focusable because native tab behaviour would tab inside
        if (element.tagName === "IFRAME" || element.tagName === "WEBVIEW") {
            if (ctx.modalizer?.userId === this._tabster.modalizer?.activeId) {
                state.found = true;
                state.lastToIgnore = state.foundElement = element;
                return NodeFilter.FILTER_ACCEPT;
            } else {
                return NodeFilter.FILTER_REJECT;
            }
        }
        
        if (!state.ignoreAccessibility && !this.isAccessible(element)) {
            if (this.isFocusable(element, false, true, true)) {
                state.skippedFocusable = true;
            }

            return NodeFilter.FILTER_REJECT;
        }

        let result: number | undefined;

        let fromCtx = state.fromCtx;
        
        if (!fromCtx) {
            fromCtx = state.fromCtx = RootAPI.getTabsterContext(
                this._tabster,
                state.from
            );
        }

        const fromMover = fromCtx?.mover;
        let groupper = ctx.groupper;
        let mover = ctx.mover;

        result = this._tabster.modalizer?.acceptElement(element, state);

        if (result !== undefined) {
            state.skippedFocusable = true;
        }

        if (result === undefined && (groupper || mover || fromMover)) {
            const groupperElement = groupper?.getElement();
            const fromMoverElement = fromMover?.getElement();
            let moverElement = mover?.getElement();

            if (
                moverElement &&
                // fromMoverElement?.contains(moverElement) &&
                // container.contains(fromMoverElement) &&
                elementContains(fromMoverElement, moverElement) &&
                elementContains(container, fromMoverElement) &&
                (!groupperElement ||
                    !mover ||
                    // fromMoverElement.contains(groupperElement))
                    elementContains(fromMoverElement, groupperElement))
            ) {
                mover = fromMover;
                moverElement = fromMoverElement;
            }

            if (
                groupperElement &&
                (groupperElement === container ||
                    // !container.contains(groupperElement))
                    !elementContains(container, groupperElement))
            ) {
                groupper = undefined;
            }

            if (moverElement && 
                //!container.contains(moverElement)) {
                    !elementContains(container, moverElement)) {
                mover = undefined;
            }

            if (groupper && mover) {
                if (
                    moverElement &&
                    groupperElement &&
                    // !groupperElement.contains(moverElement)
                    !elementContains(groupperElement, moverElement)
                ) {
                    mover = undefined;
                } else {
                    groupper = undefined;
                }
            }

            if (groupper) {
                result = groupper.acceptElement(element, state);
            }

            if (mover) {
                result = mover.acceptElement(element, state);
            }
        }

        if (result === undefined) {
            result = state.acceptCondition(element)
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_SKIP;

            if (
                result === NodeFilter.FILTER_SKIP &&
                this.isFocusable(element, false, true, true)
            ) {
                state.skippedFocusable = true;
            }
        }

        if (result === NodeFilter.FILTER_ACCEPT && !state.found) {
            state.found = true;
            state.foundElement = element;
        }

        // if (element.shadowRoot?.delegatesFocus && (result === NodeFilter.FILTER_REJECT || result === NodeFilter.FILTER_SKIP)) {
        if (isSkippedOrRejected(result) && (delegatesFocus(element) || hasSlottedChildren(element))) {
            result = NodeFilter.FILTER_ACCEPT;
        }

        return result;
    }
}

const isSkippedOrRejected = (res: number) => {
    return res === NodeFilter.FILTER_REJECT || res === NodeFilter.FILTER_SKIP;
}

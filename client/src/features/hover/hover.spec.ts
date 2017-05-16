import "reflect-metadata"
import "mocha"
import { expect } from "chai"
import { HoverFeedbackAction, HoverMouseListener, SetPopupModelAction } from "./hover"
import { SChildElement, SModelElement, SModelRoot, SParentElement } from "../../base/model/smodel"
import { Container, inject } from "inversify"
import { TYPES } from "../../base/types"
import { defaultModule } from "../../base/index"
import { Action } from "../../base/intent/actions"
import { Hoverable, hoverFeedbackFeature, popupFeature } from "./model"
import { EMPTY_ROOT } from "../../base/model/smodel-factory"

describe('hover', () => {
    class HoverListenerMock extends HoverMouseListener {
        protected popupOpen: boolean = false

        set popupIsOpen(isOpen: boolean) {
            this.popupOpen = isOpen
        }

        get popupIsOpen(): boolean {
            return this.popupOpen
        }

        set previousPopupElementMock(el: SModelElement) {
            this.state.previousPopupElement = el
        }

        protected startMouseOverTimer(target: SModelElement, event: MouseEvent): Promise<Action> {
            this.popupOpen = true
            return new Promise<Action>(() => {
            })
        }
    }

    class PopupTarget extends SChildElement {
        hasFeature(feature: symbol): boolean {
            return feature == popupFeature
        }
    }

    class HoverableTarget extends SModelElement implements Hoverable {
        hoverFeedback: boolean = false

        hasFeature(feature: symbol): boolean {
            return feature === hoverFeedbackFeature
        }
    }

    const container = new Container()
    container.load(defaultModule)
    container.bind(TYPES.MouseListener).to(HoverListenerMock)
    const hoverListener = container.get<HoverListenerMock>(TYPES.MouseListener)

    const event = {} as MouseEvent

    describe('mouseover result', () => {
        it('is empty on hovering over non-hoverable elements', () => {
            const target = new SModelElement()
            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(target, event)
            expect(mouseOverResult).to.be.empty
        })
        it('contains HoverFeedbackAction on hovering over an hoverable element', () => {
            const target = new HoverableTarget()
            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(target, event)

            expect(mouseOverResult).to.have.lengthOf(1)
            expect(mouseOverResult[0]).to.be.an.instanceof(HoverFeedbackAction)
        })
        it('contains SetPopupModelAction if popup is open and hovering over an non-hoverable element', () => {
            hoverListener.popupIsOpen = true
            const target = new SModelElement()
            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(target, event)

            expect(mouseOverResult).to.have.lengthOf(1)
            expect(mouseOverResult[0]).to.be.an.instanceof(SetPopupModelAction)
            const type = (mouseOverResult[0] as SetPopupModelAction).newRoot.type
            expect(type).to.equal(EMPTY_ROOT.type)
        })
        it('contains SetPopupModelAction and Promise if popup is open and previous target is not the same', () => {
            hoverListener.popupIsOpen = true
            const prevTarget = new PopupTarget()
            prevTarget.id = 'prevTarget'
            hoverListener.previousPopupElementMock = prevTarget
            const target = new PopupTarget()
            target.id = 'newTarget'
            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(target, event)

            expect(mouseOverResult).to.have.lengthOf(2)
            expect(mouseOverResult[0]).to.be.an.instanceof(SetPopupModelAction)
            const type = (mouseOverResult[0] as SetPopupModelAction).newRoot.type
            expect(type).to.equal(EMPTY_ROOT.type)
            expect(mouseOverResult[1]).to.be.an.instanceof(Promise)
        })
        it('contains nothing if popup is open and previous target is the same', () => {
            hoverListener.popupIsOpen = false
            const childTarget = new SChildElement()
            childTarget.id = 'someLabel'
            const target = new PopupTarget()
            target.id = 'hoverTarget'
            const root = new SModelRoot()
            root.add(target)
            target.add(childTarget)

            hoverListener.mouseOver(target, event)
            expect(hoverListener.popupIsOpen).to.equal(true)

            const mouseOverResult: (Action | Promise<Action>)[] = hoverListener.mouseOver(childTarget, event)
            expect(mouseOverResult).to.have.lengthOf(0)
        })
    })

})

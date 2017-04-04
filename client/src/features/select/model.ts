import { SModelElement } from "../../base/model/smodel"
import { SModelExtension } from "../../base/model/smodel-extension"

export const selectFeature = Symbol('selectFeature')

export interface Selectable extends SModelExtension {
    selected: boolean
}

export function isSelectable(element: SModelElement): element is SModelElement & Selectable {
    return element.hasFeature(selectFeature)
}
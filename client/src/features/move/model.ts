import { Point } from "../../utils/geometry"
import { SModelElement } from "../../base/model/smodel"
import { SModelExtension } from "../../base/model/smodel-extension"

export const moveFeature = Symbol('moveFeature')

export interface Locateable extends SModelExtension {
    position: Point
}

export function isLocateable(element: SModelElement): element is SModelElement & Locateable {
    return 'position' in element
}

export function isMoveable(element: SModelElement): element is SModelElement & Locateable {
    return element.hasFeature(moveFeature) && isLocateable(element)
}
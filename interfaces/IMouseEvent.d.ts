import { UnixTimestamp } from './GenericTypes';
/**
 * Buttons are a bit field from the DOM
 * 0	No button pressed
 * 1	Main button pressed (usually the left button)
 * 2	Secondary button pressed (usually the right button)
 * 4	Auxiliary button pressed (usually the middle button)
 */
declare type PageX = number;
declare type PageY = number;
declare type OffsetX = number;
declare type OffsetY = number;
declare type NodeId = number;
declare type Buttons = number;
declare type RelatedNodeId = NodeId;
declare type MouseEventType = number;
export declare type IMouseEvent = [
    MouseEventType,
    PageX,
    PageY,
    OffsetX,
    OffsetY,
    Buttons,
    NodeId,
    RelatedNodeId,
    UnixTimestamp
];
export {};

import { UnixTimestamp } from './GenericTypes';
declare type NodeId = number;
declare type RelatedNodeId = NodeId;
export declare enum FocusEventType {
    IN = 0,
    OUT = 1
}
export declare type IFocusEvent = [FocusEventType, NodeId, RelatedNodeId, UnixTimestamp];
export {};

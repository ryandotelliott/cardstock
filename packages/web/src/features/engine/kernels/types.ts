import type { EvalResult } from '@/features/engine/document';
import type { NodeInputsByType, NodeParamsByType, NodeType } from '@/features/nodes/node-types';

export type KernelInputsByType = {
  [T in NodeType]: { [K in keyof NodeInputsByType[T]]: EvalResult | undefined };
};

export type Kernel<T extends NodeType> = (
  inputs: KernelInputsByType[T],
  params: NodeParamsByType[T],
) => EvalResult;


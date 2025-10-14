export type NodeId = string;

export type NodeType = 'Shape.Rect' | 'Shape.Ellipse' | 'Modifier.Transform' | 'Modifier.Offset';

export type NodeParamsByType = {
  'Shape.Rect': {
    x: number;
    y: number;
    w: number;
    h: number;
    rx?: number;
    ry?: number;
  };
  'Shape.Ellipse': { cx: number; cy: number; rx: number; ry?: number };
  'Modifier.Transform': {
    sx?: number;
    sy?: number;
    r?: number;
    tx?: number;
    ty?: number;
  };
  'Modifier.Offset': {
    amount: number;
  };
};

export type NodeInputsByType = {
  'Shape.Rect': never;
  'Shape.Ellipse': never;
  'Modifier.Transform': { in: { node: NodeId } };
  'Modifier.Offset': { in: { node: NodeId } };
};

type NodeInputs<T extends NodeType> = NodeInputsByType[T] extends never
  ? { inputs?: undefined }
  : { inputs: NodeInputsByType[T] };

type BaseNode<T extends NodeType> = {
  id: NodeId;
  name: string;
  type: T;
  params: NodeParamsByType[T];
} & NodeInputs<T>;

export type Node = {
  [T in NodeType]: BaseNode<T>;
}[NodeType];

// Helper to extract a specific node variant by type
export type NodeOf<T extends NodeType> = Extract<Node, { type: T }>;

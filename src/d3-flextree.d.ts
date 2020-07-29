declare module 'd3-flextree' {
  import { HierarchyPointNode, TreeLayout } from 'd3-hierarchy';

  export interface FlexHierarchy<Datum> extends HierarchyPointNode<Datum> {
    /**
     * The computed x-coordinate of the node position.
     */
    x: number;

    /**
     * The computed y-coordinate of the node position.
     */
    y: number;

    /**
     * All of the nodes in this subtree (same as descendants())
     */
    nodes: this[];

    numChildren: number;
    hasChildren: boolean;
    noChildren: boolean;

    /**
     * number of nodes in this subtree
     */
    length: number;

    /**
     * size of this node (the values fetched by the nodeSize accessor) as a
     * two-element array.
     */
    size: [number, number];

    xSize: number;
    ySize: number;
    top: number;
    bottom: number;
    left: number;
    right: number;

    /**
     * the minimum top and left, and the maximum bottom and right values for all
     * of the nodes in this subtree
     */
    extents: [number, number, number, number];
  }

  export interface FlexTreeLayout<Datum> extends TreeLayout<Datum> {
    /**
     * Returns the current node size, which defaults to null. A node size of null
     * indicates that a layout size will be used instead.
     */
    nodeSize(): [number, number] | null;

    /**
     * Sets this tree layout's node size to the specified [width, height] array
     * and returns this tree layout. When a node size is specified, the root node
     * is always positioned at <0, 0>.
     *
     * @param size The specified two-element size array.
     */
    nodeSize(size: [number, number]): this;

    /**
     * Sets this tree layout's node size to be dependent on the content of the
     * node.
     *
     * @param size The specified two-element size array.
     */
    nodeSize(f: (d: FlexHierarchy<Datum>) => [number, number]): this;

    /**
     * Creates a new hierarchy from the data, using the children accessors in
     * effect when called. This is an enhanced version of the d3.hierarchy
     * function, and produces a tree of instances of a class derived from
     * d3.hierarchy.
     *
     * @param data The data to be laid out.
     */
    hierarchy(data: Datum): FlexHierarchy<Datum>;
  }

  export function flextree<Datum>(): FlexTreeLayout<Datum>;
}

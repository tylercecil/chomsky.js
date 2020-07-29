declare module 'd3-flextree' {
  import { HierarchyPointNode, TreeLayout } from 'd3-hierarchy';

  export interface FlexHierarchy<Datum> extends HierarchyPointNode<Datum> {
    /**
     * The computed x-coordinate of the node position. This is the center x
     * position, between `left` and `right`.
     */
    x: number;

    /**
     * The computed y-coordinate of the node position This is the top y
     * position, equal to `top`.
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
     * The number of nodes in this subtree.
     */
    length: number;

    /**
     * The size of this node (the values fetched by the nodeSize accessor) as a
     * two-element array.
     */
    size: [number, number];

    xSize: number;
    ySize: number;

    /**
     * Equal to `y`.
     */
    top: number;

    /**
     * Equal to `y + ySize`.
     */
    bottom: number;

    /**
     * Equal to `x - xSize / 2`
     */
    left: number;

    /**
     * Equal to `x + xSize / 2`.
     */
    right: number;

    /**
     * The minimum top and left, and the maximum bottom and right values for all
     * of the nodes in this subtree.
     */
    extents: {
      bottom: number;
      left: number;
      right: number;
      top: number;
    };
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
     * If a spacing argument is given as a constant number, then the layout will
     * insert the given fixed spacing between every adjacent node. If it is given
     * as a function, then that function will be passed two nodes, and should
     * return the minimum allowable spacing between those nodes. If spacing is
     * not specified, this returns the current spacing, which defaults to 0.
     */
    spacing(s: number): this;
    spacing(
      f: (a: FlexHierarchy<Datum>, b: FlexHierarchy<Datum>) => number
    ): this;
    spacing(): number;

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

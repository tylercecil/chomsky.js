/**
 * AST representation of a tree after parsing, including all data and metadata
 * nodes will need for rendering.
 */
type Tree = {
  /**
   * Node types are triples, including the base name, as well as possible
   * subscripts and superscripts. A node with no `nodeType` is an empty
   * node (not to be confused with a ∅-node).
   */
  nodeType?: { name: string; sub: string; sup: string };
  /**
   * The name `children` has special meaning for `d3.hierarchy`.
   */
  children: Tree[];
  /**
   * Leaf nodes contain data strings. Additionally, they may mark if they were
   * collapsed, denoting a "hidden subtree".
   */
  leaf?: { data: string; isCollapsed: boolean };
  /**
   * Optionally, nodes may have classes associated with them, allowing for
   * custom user CSS.
   */
  classes?: string[];
};

function Tree(): Tree {
  return { children: [] };
}

/**
 * Utility builder for Trees, which may be used for testing purposes.
 */
class TreeBuilder {
  tree: Tree;
  constructor() {
    this.tree = Tree();
  }
  name(name: string): TreeBuilder {
    if (!this.tree.nodeType) {
      this.tree.nodeType = { name: '', sub: '', sup: '' };
    }
    this.tree.nodeType.name = name;
    return this;
  }
  sub(sub: string): TreeBuilder {
    if (!this.tree.nodeType) {
      this.tree.nodeType = { name: '', sub: '', sup: '' };
    }
    this.tree.nodeType.sub = sub;
    return this;
  }
  sup(sup: string): TreeBuilder {
    if (!this.tree.nodeType) {
      this.tree.nodeType = { name: '', sub: '', sup: '' };
    }
    this.tree.nodeType.sup = sup;
    return this;
  }
  data(data: string): TreeBuilder {
    if (!this.tree.leaf) {
      this.tree.leaf = { data: '', isCollapsed: false };
    }
    this.tree.leaf.data = data;
    return this;
  }
  collapse(isCollapsed = true): TreeBuilder {
    if (!this.tree.leaf) {
      this.tree.leaf = { data: '', isCollapsed: false };
    }
    this.tree.leaf.isCollapsed = isCollapsed;
    return this;
  }
  add(...treeBuilders: TreeBuilder[]): TreeBuilder {
    treeBuilders.forEach((tb) => this.tree.children.push(tb.build()));
    return this;
  }
  build(): Tree {
    return this.tree;
  }
}

export { Tree, TreeBuilder };

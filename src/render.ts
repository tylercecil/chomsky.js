import { Tree } from './tree';
import { Selection } from 'd3-selection';
import { flextree, FlexHierarchy } from 'd3-flextree';

type Div = Selection<HTMLDivElement, string, HTMLElement, undefined>;
type SVG = Selection<SVGSVGElement, string, HTMLElement, undefined>;

/**
 * TreeData is a Tree with one addition: it's bound SVG element.
 * This allows for easy updating after the SVG is made (which is useful, because
 * node size is based on the size of the SVG element).
 */
interface TreeData extends Tree {
  size: [number, number];
}
type Hierarchy = FlexHierarchy<TreeData>;

/**
 * Bundles together settings and options used for rendering a tree.
 *
 * Nodes are assumed to have size 1x1 in viewBox coordinates, so all numbers
 * can be thought of as percentage of node radius.
 *
 * TODO: This should eventually be in its own file, and expanded upon.
 */
const config = {
  /**
   * Individual node padding (padding.x defines left and right padding).
   */
  padding: {
    x: 0.25,
    y: 0.25,
  },
  /**
   * Individual node margin (margin.x defines left and right margin).
   */
  margin: {
    x: 0.125,
    y: 1,
  },
  /**
   * Extra space to be placed between lines of text. 0 causes BBoxes to totally
   * overlap. Given in em units.
   */
  lineSpacing: 1.2,
  /**
   * Stroke width of all figures.
   */ strokeWidth: 0.05,
  /**
   * Margin for the entire svg (treeMargin.x defines left and right margin)
   */
  treeMargin: {
    x: 1,
    y: 1,
  },
  maxScale: 40,
};

/**
 * `geom` contains a set of functions which are used to comprehend the geometry
 * of nodes and links.
 */
const geom = {
  /**
   * Bounding Box after applying margin to `pBox`. This should follow node size.
   */
  mBox: {
    x1: (n: Hierarchy) => n.left,
    y1: (n: Hierarchy) => n.top,
    x2: (n: Hierarchy) => n.right,
    y2: (n: Hierarchy) => n.bottom,
    width: (n: Hierarchy) => geom.mBox.x2(n) - geom.mBox.x1(n),
    height: (n: Hierarchy) => geom.mBox.y2(n) - geom.mBox.y1(n),
  },

  /**
   * Bounding Box after applying padding to the content, `cBox`. This is the
   * node size with the margin removed.
   */
  pBox: {
    x1: (n: Hierarchy) => n.left + config.margin.x,
    y1: (n: Hierarchy) => n.top + config.margin.y,
    x2: (n: Hierarchy) => n.right - config.margin.x,
    y2: (n: Hierarchy) => n.bottom - config.margin.y,
    width: (n: Hierarchy) => geom.pBox.x2(n) - geom.pBox.x1(n),
    height: (n: Hierarchy) => geom.pBox.y2(n) - geom.pBox.y1(n),
  },

  /**
   * Bounding Box for the node content, before padding and margin.
   */
  cBox: {
    x1: (n: Hierarchy) => n.left + config.margin.x + config.padding.x,
    y1: (n: Hierarchy) => n.top + config.margin.y + config.padding.y,
    x2: (n: Hierarchy) => n.right - config.margin.x - config.padding.x,
    y2: (n: Hierarchy) => n.bottom - config.margin.y - config.padding.x,
    width: (n: Hierarchy) => geom.pBox.x2(n) - geom.pBox.x1(n),
    height: (n: Hierarchy) => geom.pBox.y2(n) - geom.pBox.y1(n),
  },

  centerX: (n: Hierarchy) => n.x,
};

/**
 * Renders `tree` into an SVG, and then sets the body of `div` to that SVG.
 *
 * Note: This will clear the existing body of div first.
 *
 * TODO: `render` currently ignores collapsed trees.
 * TODO: `render` should use d3-flextree, to support varying node sizes.
 *
 * @param {Tree} tree Tree to be rendered into SVG.
 * @param {Selection} div `<div>` to be associated with `tree`.
 */
export function render(tree: Tree, div: Div) {
  // Node Size is determined exclusively by the text contained within the node.
  // We will treat 1 = 1em in our coordinate system. So the height is the number
  // of lines of information, while the length the length of the longest line.
  // This will also use a base padding, defined in `config`.
  // TODO: I actually want to MAKE the SVGs BEFORE I layout the data, that way I
  // can calculate true width/height of the text elements.
  const layout = flextree<TreeData>()
    .spacing(0)
    .nodeSize((d) => {
      return [
        d.data.size[0] + 2 * (config.padding.x + config.margin.x),
        d.data.size[1] + 2 * (config.padding.y + config.margin.y),
      ];
    });
  const root = layout.hierarchy(tree as TreeData) as Hierarchy;

  div.html('');
  const svg = makeSVG(div);

  initNodes(svg, root);
  layout(root);

  sizeSvg(svg, root);
  makeNodes(svg, root);
  makeLinks(svg, root);
  styleTree(svg);
}

function initNodes(svg: SVG, root: Hierarchy) {
  svg
    .select('g.nodes')
    .selectAll('g.node')
    .data(root.descendants())
    .join((enter) => {
      const node = enter.append('g').classed('node', true);

      node
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', 0);

      const nodeType = node
        .filter((d) => d.data.nodeType != null)
        .append('text')
        .attr('x', 0)
        .attr('y', 0)
        .classed('nodeType', true)
        .text((d) => d.data.nodeType?.name ?? '')
        .attr('font-size', 1)
        .attr('dominant-baseline', 'hanging')
        .attr('text-anchor', 'middle');
      nodeType
        .filter((d) => d.data.nodeType?.sub != '')
        .append('tspan')
        .text((d) => d.data.nodeType!.sub)
        .attr('font-size', 0.9)
        .attr('baseline-shift', 'sub');
      nodeType
        .filter((d) => d.data.nodeType?.sup != '')
        .append('tspan')
        .text((d) => d.data.nodeType!.sup)
        .attr('font-size', 0.9)
        .attr('baseline-shift', 'super');

      node
        .filter((d) => d.data.leaf?.data != null)
        .append('text')
        .attr('x', 0)
        .attr('y', 0)
        .classed('nodeData', true)
        .text((d) => d.data.leaf!.data)
        // Implicitly assuming there can be no data without a type...
        .attr('dx', 0)
        .attr('dy', (d) => {
          // TODO: Use the BBox up to this point to determine spacing
          return (d.data.nodeType != null ? config.lineSpacing : 0) + 'em';
        })
        .attr('font-size', 0.9)
        .attr('dominant-baseline', 'hanging')
        .attr('text-anchor', 'middle');

      node.each((d, i, n) => {
        const bb = n[i].getBBox();
        d.data.size = [bb.width, bb.height];
      });

      return node;
    });
}

/**
 * Initializes an SVG object inside the given div. This SVG will only have two
 * child nodes: `<g class="links">` and `<g class="nodes">`.
 *
 * Because rendering takes place inside a `viewBox`, a reasonable max-width is
 * provided, based on `config.maxScale`.
 *
 * @param div parent div element.
 * @param root data to be rendered in SVG. Provided to generate `viewBox`.
 * @return newly created SVG child of `div`.
 */
function makeSVG(div: Div) {
  const svg = div
    .append('svg')
    .style('display', 'block')
    .style('margin', 'auto');
  svg.append('g').classed('links', true);
  svg.append('g').classed('nodes', true);

  return svg;
}

function sizeSvg(svg: SVG, root: Hierarchy) {
  const vb = viewBox(root);
  svg.attr('viewBox', vb.join(' ')).style('max-width', vb[2] * config.maxScale);
}

/**
 * Returns the needed viewBox dimensions of an SVG which should contain `root`,
 * providing a margin based on `config.margin`.
 *
 * @param root data being rendered.
 * @return calculates necessary `[minX, minY, maxX, maxY]`
 */
function viewBox(root: Hierarchy) {
  const max = { x: -Infinity, y: -Infinity };
  const min = { x: Infinity, y: Infinity };
  root.each((d) => {
    max.x = Math.max(geom.mBox.x2(d), max.x);
    max.y = Math.max(geom.mBox.y2(d), max.y);
    min.x = Math.min(geom.mBox.x1(d), min.x);
    min.y = Math.min(geom.mBox.y1(d), min.y);
  });

  return [
    min.x - config.treeMargin.x,
    min.y - config.treeMargin.y,
    max.x - min.x + 2 * config.treeMargin.x,
    max.y - min.y + 2 * config.treeMargin.y,
  ];
}

/**
 * Attach all nodes from `root` to `svg`'s `<g class="nodes">` child.
 */
function makeNodes(svg: SVG, root: Hierarchy) {
  const node = svg
    .select('g.nodes')
    .selectAll('g.node')
    .data(root.descendants());

  node
    .select('rect')
    .attr('x', geom.mBox.x1)
    .attr('y', geom.mBox.y1)
    .attr('width', geom.mBox.width)
    .attr('height', geom.mBox.height);

  node.select('.nodeType').attr('x', geom.centerX).attr('y', geom.cBox.y1);

  node.select('.nodeData').attr('x', geom.centerX).attr('y', geom.cBox.y1);
}

/**
 * Attach all edges from `root` to `svg`'s `<g class="links">` child.
 */
function makeLinks(svg: SVG, root: Hierarchy) {
  const enter = svg
    .select('g.links')
    .selectAll('line.link')
    .data(root.links())
    .enter();

  enter
    .filter((d) => !(d.target.data.leaf?.isCollapsed ?? false))
    .append('line')
    .classed('link', true)
    // For the link, we ignore the y padding
    .attr('x1', (d) => geom.centerX(d.source as Hierarchy))
    .attr('y1', (d) => geom.pBox.y2(d.source as Hierarchy))
    .attr('x2', (d) => geom.centerX(d.target as Hierarchy))
    .attr('y2', (d) => geom.pBox.y1(d.target as Hierarchy));

  enter
    .filter((d) => d.target.data.leaf?.isCollapsed ?? false)
    .append('polygon')
    .classed('link', true)
    .attr('points', (d) => {
      const source = {
        x: geom.centerX(d.source as Hierarchy),
        y: geom.pBox.y2(d.source as Hierarchy),
      };
      const targ = {
        y: geom.pBox.y1(d.target as Hierarchy),
        left: geom.pBox.x1(d.target as Hierarchy),
        right: geom.pBox.x2(d.target as Hierarchy),
      };
      return `${source.x},${source.y} ${targ.left},${targ.y} ${targ.right},${targ.y}`;
    });
}

/**
 * Updates tree with any needed styling.
 *
 * TODO this style should eventually come from `config`
 */
function styleTree(svg: SVG) {
  svg
    .selectAll('g.nodes g.node rect')
    .style('fill', 'white')
    .style('stroke-width', config.strokeWidth)
    .style('stroke', 'black')
    .style('opacity', 0);
  svg
    .selectAll('g.links')
    .style('stroke', 'black')
    .style('stroke-width', config.strokeWidth)
    .style('fill-opacity', 0);
}

import { Tree } from './tree';
import { select, Selection } from 'd3-selection';
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
   * Extra space to be placed between lines of text. 0 causes BBoxes to be
   * touching but non-overlapping.
   */
  lineSpacing: 0.2,
  /**
   * Stroke width of all figures.
   */
  strokeWidth: 0.05,
  /**
   * Margin for the entire svg (treeMargin.x defines left and right margin)
   */
  treeMargin: {
    x: 1,
    y: 1,
  },
  maxScale: 40,
};

// Flextree has a confusing x/y/top/bottom/left/right scheme. To avoid mistakes,
// I'm making my own.
// I need to fork flextree... it's kinda a dead project
const cx = (d: Hierarchy) => d.x;
const cy = (d: Hierarchy) => d.top + d.ySize / 2;
const top = (d: Hierarchy) => d.top;
const bottom = (d: Hierarchy) => d.bottom;
const left = (d: Hierarchy) => d.left;
const right = (d: Hierarchy) => d.right;

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

      node.append('rect');

      const nodeType = node
        .append('text')
        .classed('nodeType', true)
        .text((d) => d.data.nodeType?.name ?? '')
        .attr('font-size', 1)
        .attr('dominant-baseline', 'middle')
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
        .classed('nodeData', true)
        .text((d) => d.data.leaf!.data)
        // Implicitly assuming there can be no data without a type...
        .attr('dx', 0)
        .attr('dy', (d) => {
          return nodeType.node()!.getBBox().height + config.lineSpacing;
        })
        .attr('font-size', 0.9)
        .attr('dominant-baseline', 'middle')
        .attr('text-anchor', 'middle');

      node.each((d, i, g) => {
        const bb = select(g[i]).node()!.getBBox();
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
    max.x = Math.max(right(d), max.x);
    max.y = Math.max(bottom(d), max.y);
    min.x = Math.min(left(d), min.x);
    min.y = Math.min(top(d), min.y);
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
  const textStartY = (d: Hierarchy) =>
    top(d) + 0.5 + config.padding.y + config.margin.y;

  const node = svg
    .select('g.nodes')
    .selectAll('g.node')
    .data(root.descendants());

  node
    .select('rect')
    .attr('x', (d) => left(d))
    .attr('y', (d) => top(d))
    .attr('width', (d) => d.xSize)
    .attr('height', (d) => d.ySize);

  node.select('.nodeType').attr('x', cx).attr('y', textStartY);

  node.select('.nodeData').attr('x', cx).attr('y', textStartY);
}

/**
 * Attach all edges from `root` to `svg`'s `<g class="links">` child.
 */
function makeLinks(svg: SVG, root: Hierarchy) {
  svg
    .select('g.links')
    .selectAll('line.link')
    .data(root.links())
    .enter()
    .append('line')
    .classed('link', true)
    // For the link, we ignore the y padding
    .attr('x1', (d) => cx(d.source as Hierarchy))
    .attr('y1', (d) => bottom(d.source as Hierarchy) - config.margin.y)
    .attr('x2', (d) => cx(d.target as Hierarchy))
    .attr('y2', (d) => top(d.target as Hierarchy) + config.margin.y);
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
    .selectAll('g.links line')
    .style('stroke', 'black')
    .style('stroke-width', config.strokeWidth);
}

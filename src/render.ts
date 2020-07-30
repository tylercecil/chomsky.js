import { Tree } from './tree';
import { Selection } from 'd3-selection';
import { flextree, FlexHierarchy } from 'd3-flextree';

type Div = Selection<HTMLDivElement, string, HTMLElement, undefined>;
type SVG = Selection<SVGSVGElement, string, HTMLElement, undefined>;
type TreeData = FlexHierarchy<Tree>;

/**
 * Bundles together settings and options used for rendering a tree.
 *
 * Nodes are assumed to have size 1x1 in viewBox coordinates, so all numbers
 * can be thought of as percentage of node radius.
 *
 * TODO: This should eventually be in its own file, and expanded upon.
 */
const config = {
  nodePad: {
    x: 1,
    y: 1.5,
  },
  linkWidth: 0.1,
  margin: {
    x: 1,
    y: 1,
  },
  maxScale: 50,
};

// Flextree has a confusing x/y/top/bottom/left/right scheme. To avoid mistakes,
// I'm making my own.
// I need to fork flextree... it's kinda a dead project
const cx = (d: TreeData) => d.x;
const cy = (d: TreeData) => d.top + d.ySize / 2;
const top = (d: TreeData) => d.top;
const bottom = (d: TreeData) => d.bottom;
const left = (d: TreeData) => d.left;
const right = (d: TreeData) => d.right;

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
  const layout = flextree<Tree>()
    .spacing(0)
    .nodeSize((d) => {
      const lines: string[] = [];
      if (d.data.nodeType) {
        lines.push(
          d.data.nodeType.name + d.data.nodeType.sub + d.data.nodeType.sup
        );
      }
      if (d.data.leaf) {
        lines.push(d.data.leaf.data);
      }
      const width = Math.max(...lines.map((s) => s.length * 0.8));
      const height = lines.length;

      return [width + config.nodePad.x, height + config.nodePad.y];
    });
  const root = layout.hierarchy(tree);
  layout(root);

  div.html('');

  const svg = makeSVG(div, root);
  makeNodes(svg, root);
  makeLinks(svg, root);
  styleTree(svg);
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
function makeSVG(div: Div, root: TreeData) {
  console.log(div.attr('font-size'));
  const vb = viewBox(root);
  const svg = div
    .append('svg')
    .attr('viewBox', vb.join(' '))
    .style('max-width', vb[2] * config.maxScale)
    .style('display', 'block')
    .style('margin', 'auto');
  svg.append('g').classed('links', true);
  svg.append('g').classed('nodes', true);

  return svg;
}

/**
 * Returns the needed viewBox dimensions of an SVG which should contain `root`,
 * providing a margin based on `config.margin`.
 *
 * @param root data being rendered.
 * @return calculates necessary `[minX, minY, maxX, maxY]`
 */
function viewBox(root: TreeData) {
  const max = { x: -Infinity, y: -Infinity };
  const min = { x: Infinity, y: Infinity };
  root.each((d) => {
    max.x = Math.max(right(d), max.x);
    max.y = Math.max(bottom(d), max.y);
    min.x = Math.min(left(d), min.x);
    min.y = Math.min(top(d), min.y);
  });

  return [
    min.x - config.margin.x,
    min.y - config.margin.y,
    max.x - min.x + 2 * config.margin.x,
    max.y - min.y + 2 * config.margin.y,
  ];
}

/**
 * Attach all nodes from `root` to `svg`'s `<g class="nodes">` child.
 */
function makeNodes(svg: SVG, root: TreeData) {
  const textStartY = (d: TreeData) => top(d) + 0.5 + config.nodePad.y / 2;
  svg
    .select('g.nodes')
    .selectAll('g.node')
    .data(root.descendants())
    .join((enter) => {
      const node = enter.append('g').classed('node', true);
      node
        .append('rect')
        .attr('x', (d) => left(d))
        .attr('y', (d) => top(d))
        .attr('width', (d) => d.xSize)
        .attr('height', (d) => d.ySize);
      const nodeType = node
        .append('text')
        .text((d) => d.data.nodeType?.name ?? '')
        .attr('x', cx)
        .attr('y', textStartY)
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
        .text((d) => d.data.leaf!.data)
        .attr('x', cx)
        .attr('y', textStartY)
        // Implicitly assuming there can be no data without a type...
        .attr('dx', 0)
        .attr('dy', '1em')
        .attr('font-size', 0.9)
        .attr('dominant-baseline', 'middle')
        .attr('text-anchor', 'middle');
      return node;
    });
}

/**
 * Attach all edges from `root` to `svg`'s `<g class="links">` child.
 */
function makeLinks(svg: SVG, root: TreeData) {
  svg
    .select('g.links')
    .selectAll('line.link')
    .data(root.links())
    .enter()
    .append('line')
    .classed('link', true)
    // For the link, we ignore the y padding
    .attr('x1', (d) => cx(d.source as TreeData))
    .attr('y1', (d) => bottom(d.source as TreeData) - config.nodePad.y / 2)
    .attr('x2', (d) => cx(d.target as TreeData))
    .attr('y2', (d) => top(d.target as TreeData) + config.nodePad.y / 2);
}

/**
 * Updates tree with any needed styling.
 *
 * TODO this style should eventually come from `config`
 */
function styleTree(svg: SVG) {
  svg
    .selectAll('g.nodes g.node rect')
    .style('stroke-width', 0)
    .style('opacity', 0);
  svg
    .selectAll('g.links line')
    .style('stroke', 'black')
    .style('stroke-width', config.linkWidth);
}

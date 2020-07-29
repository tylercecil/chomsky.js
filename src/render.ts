import { Tree } from './tree';
import { Selection } from 'd3-selection';
import { flextree, FlexHierarchy } from 'd3-flextree';

type Div = Selection<HTMLDivElement, string, HTMLElement, undefined>;
type SVG = Selection<SVGSVGElement, string, HTMLElement, undefined>;
type TreeData = FlexHierarchy<Tree>;

// NOTE: We will set em to 1 in the svg coords.That means, if we want the SVG to
// have a max-size based on the surrounding div, we need to set max-width to
// viewBox-width * parent.em.

/**
 * Bundles together settings and options used for rendering a tree.
 *
 * Nodes are assumed to have size 1x1 in viewBox coordinates, so all numbers
 * can be thought of as percentage of node radius.
 *
 * TODO: This should eventually be in its own file, and expanded upon.
 */
const config = {
  nodeSize: 0.2,
  linkWidth: 0.01,
  margin: {
    x: 1.5 * 0.2,
    y: 1.2 * 0.2,
  },
  maxScale: 150,
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
  const layout = flextree().nodeSize([1, 1]);
  const root = layout.hierarchy(tree) as TreeData;
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
    max.x = Math.max(d.x, max.x);
    max.y = Math.max(d.y, max.y);
    min.x = Math.min(d.x, min.x);
    min.y = Math.min(d.y, min.y);
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
  svg
    .select('g.nodes')
    .selectAll('g.node')
    .data(root.descendants())
    .join((enter) => {
      const node = enter.append('g').classed('node', true);
      node
        .append('ellipse')
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
        .attr('ry', config.nodeSize)
        .attr('rx', config.nodeSize);
      const nodeType = node
        .append('text')
        .text((d) => d.data.nodeType?.name ?? '')
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y)
        .attr('font-size', config.nodeSize)
        .attr('dominant-baseline', 'middle')
        .attr('text-anchor', 'middle');
      nodeType
        .filter((d) => d.data.nodeType?.sub != '')
        .append('tspan')
        .text((d) => d.data.nodeType!.sub)
        .attr('font-size', config.nodeSize * 0.9)
        .attr('baseline-shift', 'sub');
      nodeType
        .filter((d) => d.data.nodeType?.sup != '')
        .append('tspan')
        .text((d) => d.data.nodeType!.sup)
        .attr('font-size', config.nodeSize * 0.9)
        .attr('baseline-shift', 'super');

      node
        .filter((d) => d.data.leaf?.data != null)
        .append('text')
        .text((d) => d.data.leaf!.data)
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y)
        .attr('dx', 0)
        .attr('dy', '1.5em')
        .attr('font-size', config.nodeSize * 0.9)
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
    .attr('x1', (d) => d.source.x)
    .attr('y1', (d) => d.source.y)
    .attr('x2', (d) => d.target.x)
    .attr('y2', (d) => d.target.y);
}

/**
 * Updates tree with any needed styling.
 *
 * TODO this style should eventually come from `config`
 */
function styleTree(svg: SVG) {
  svg.selectAll('g.nodes g.node ellipse').style('fill', 'white');
  svg
    .selectAll('g.links line')
    .style('stroke', 'black')
    .style('stroke-width', config.linkWidth);
}

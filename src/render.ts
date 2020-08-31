import { Tree } from './tree';
import { Selection } from 'd3-selection';
import { flextree, FlexHierarchy } from 'd3-flextree';

type Div = Selection<HTMLDivElement, string, HTMLElement, undefined>;
type SVG = Selection<SVGSVGElement, string, HTMLElement, undefined>;
interface TreeWithSize extends Tree {
  size: [number, number];
}
type Hierarchy = FlexHierarchy<TreeWithSize>;

const defaultSpacing = {
  /**
   * Individual node padding (always centered).
   */
  padding: {
    x: 0.0,
    y: 0.25,
  },
  /**
   * Individual node margin (always centered).
   */
  margin: {
    x: 0.75,
    y: 1,
  },
  /**
   * Line Spacing within a node.
   */
  lineSpacing: 1.2,
};

const defaultStyle = {
  strokeWidth: 0.05,
};

/**
 * Appends an SVG to `div`, in which `tree` will be rendered as a visual syntax
 * tree.
 *
 * TODO: Maybe have the argument be a plain div, and not a d3 selection. That
 *       way any ol tool could be used.
 *
 * @param {Tree} tree Tree to be rendered into SVG.
 * @param {Selection} div `<div>` in which to append the Tree SVG.
 */
export function render(tree: Tree, div: Div) {
  // TODO: Eventually these will be merged with a config argument
  const spacing = defaultSpacing;
  const style = defaultStyle;

  const geom = {
    /**
     * Bounding Box after applying margin to `pBox`. This should follow nodeSize.
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
     * nodeSize with the margin removed.
     */
    pBox: {
      x1: (n: Hierarchy) => n.left + spacing.margin.x,
      y1: (n: Hierarchy) => n.top + spacing.margin.y,
      x2: (n: Hierarchy) => n.right - spacing.margin.x,
      y2: (n: Hierarchy) => n.bottom - spacing.margin.y,
      width: (n: Hierarchy) => geom.pBox.x2(n) - geom.pBox.x1(n),
      height: (n: Hierarchy) => geom.pBox.y2(n) - geom.pBox.y1(n),
    },

    /**
     * Bounding Box for the node content, before padding and margin.
     */
    cBox: {
      x1: (n: Hierarchy) => n.left + spacing.margin.x + spacing.padding.x,
      y1: (n: Hierarchy) => n.top + spacing.margin.y + spacing.padding.y,
      x2: (n: Hierarchy) => n.right - spacing.margin.x - spacing.padding.x,
      y2: (n: Hierarchy) => n.bottom - spacing.margin.y - spacing.padding.x,
      width: (n: Hierarchy) => geom.cBox.x2(n) - geom.cBox.x1(n),
      height: (n: Hierarchy) => geom.cBox.y2(n) - geom.cBox.y1(n),
    },

    centerX: (n: Hierarchy) => n.x,

    calcApplySpacing: (n: Hierarchy): [number, number] => [
      n.data.size[0] + 2 * (spacing.padding.x + spacing.margin.x),
      n.data.size[1] + 2 * (spacing.padding.y + spacing.margin.y),
    ],
  };

  const layout = flextree<TreeWithSize>()
    .spacing(0)
    .nodeSize(geom.calcApplySpacing);
  const root = layout.hierarchy(tree as TreeWithSize) as Hierarchy;
  const svg = makeSVG(div);

  renderNodes(svg, root); // Pre-renders nodes, to calculate size
  layout(root);
  sizeSvg(svg, root);
  renderNodes(svg, root); // Re-renders nodes, once layout is calculated
  renderLinks(svg, root);

  function renderNodes(svg: SVG, root: Hierarchy) {
    svg
      .select('g.nodes')
      .selectAll('g.node')
      .data(root.descendants())
      .join(
        (enter) => {
          const node = enter.append('g').classed('node', true);

          node
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 0)
            .attr('height', 0)
            .style('fill', 'white')
            .style('stroke-width', style.strokeWidth)
            .style('stroke', 'black')
            .style('opacity', 0.5);

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
              return (d.data.nodeType != null ? spacing.lineSpacing : 0) + 'em';
            })
            .attr('font-size', 0.9)
            .attr('dominant-baseline', 'hanging')
            .attr('text-anchor', 'middle');

          node.each((d, i, n) => {
            const bb = n[i].getBBox();
            d.data.size = [bb.width, bb.height];
          });

          return node;
        },
        (update) => {
          update
            .select('rect')
            .attr('x', geom.mBox.x1)
            .attr('y', geom.mBox.y1)
            .attr('width', geom.mBox.width)
            .attr('height', geom.mBox.height);

          update
            .select('.nodeType')
            .attr('x', geom.centerX)
            .attr('y', geom.cBox.y1);

          update
            .select('.nodeData')
            .attr('x', geom.centerX)
            .attr('y', geom.cBox.y1);
          return update;
        }
      );
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
    const vb = calcViewBox(root);
    svg.attr('viewBox', vb.join(' '));

    const parentEm = div.style('font-size').match(/([0-9]*)px/);
    if (parentEm) {
      svg.style('max-width', vb[2] * parseInt(parentEm[0]));
    }
  }

  function calcViewBox(root: Hierarchy) {
    const max = { x: -Infinity, y: -Infinity };
    const min = { x: Infinity, y: Infinity };
    root.each((n) => {
      max.x = Math.max(geom.mBox.x2(n), max.x);
      max.y = Math.max(geom.mBox.y2(n), max.y);
      min.x = Math.min(geom.mBox.x1(n), min.x);
      min.y = Math.min(geom.mBox.y1(n), min.y);
    });

    return [min.x, min.y, max.x - min.x, max.y - min.y];
  }

  /**
   * Attach all edges from `root` to `svg`'s `<g class="links">` child.
   */
  function renderLinks(svg: SVG, root: Hierarchy) {
    const enter = svg
      .select('g.links')
      .selectAll('.link')
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

    svg
      .select('g.links')
      .style('stroke', 'black')
      .style('stroke-width', style.strokeWidth)
      .style('fill-opacity', 0);
  }
}

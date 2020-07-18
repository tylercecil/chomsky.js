# ChomTree Markup Grammar

## Informal Feature Examples

### Standard Tree

```
[NP [D the] [AdjP [Adj big] [Adj red]] [N dog]]
```

Trees are bracket-marked, with a node type following the opening bracket. Leaf
nodes contain further words, representing the leaf data.

### Multi-Word Nodes

```
[NP [D the] [N ice cream truck]]
```

Leaf nodes may contain multiple words.

### Non-Branching Shorthand

```
[NP [D the] [AdjP.Adj big] [N dog]]
```

For chains of non branching nodes, a `.` may be placed between node types. This
is equivelant to `[NP [D the] [AdjP [Adj big]] [N dog]]`.

### Collapsed Tree

```
[NP* the big red dog]
```

To mark an unknown subtree, an `*` is used.

### Node Type Subscripts / Super Scripts

```
[VP [V gave] [NP_1.N her] [NP_2.N it]]
[VP [V gave] [NP^1.N her] [NP^2.N it]]
```

Node types may have subscripts and superscripts denoted with `_` and `^`
respectively. Currently only node types may have scripts.

### Null Content

```
[TP [VP* ...] [T /] [NP* ...]
```

If a node's data should be "∅", a `/` may be used.

### Empty Node

```
[TP [VP* ...] [] [NP* ...]
```

A totally empty node will draw a line to a totally blank child.

### Leaf Nodes without Data

```
[TP [NP] [T] [VP]]
```

Leaf nodes need not contain data.

## EBNF

Whitespace tokens are ignored, with the exception of the NodeData section,
where they are preserved.

A `word` is any unicode string not containing a symbol used elsewhere in the
grammar or whitespace.

```
Node     := "[" "]" | "[" Node_T {"." Node_T} ( NodeList | NodeData ) "]".
Node_T   := word [(sub [sup]) | (sup [sub])].
NodeList := { Node }.
NodeData := ( ["*"] word {word | DataSymbols} | Null ).
sub      := "_" word.
sup      := "^" word.
Null     := "/".
DataSymbols := "." | "*" | "/" | "_" | "^".
```

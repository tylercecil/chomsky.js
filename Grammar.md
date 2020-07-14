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
[NP [D the] [AdjP [Adj big] [Adj red]] [N dog]]
```

Leaf nodes may contain multiple words.

### Non-Branching Shorthand

```
[NP [D the] [AdjP.Adj big] [N dog]]
```

For chains of non branching nodes, a `.` may be placed between node types.

### Collapsed Tree

```
[NP* the big red dog]
```

To mark an unknown subtree, an `*` is used.

### Node Type Subscripts / Super Scripts

```
[VP [V gave] [NP_1.N her] [NP_2.N it]]
[VP [V gave] [NP_1.N her] [NP_2.N it]]
```

Node types may have subscripts and superscripts denoted with `_` and `^`
respectively.

### Null Content

```
[TP [VP* ...] [T /] [NP* ...]
```

If a node's data should be ∅, a `/` may be used.

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

```
Node      := "[" Node_T {"." Node_T} ( NodeList | NodeData ) "].
Node_T    := word [(sub [sup]) | (sup [sub])].
NodeList  := { Node | EmptyNode }.
EmptyNode := "[" "]".
NodeData  := ( ["*"] word {word} | Null ).
sub       := "_" word.
sup       := "^" word.
Null      := "/".
```

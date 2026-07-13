# stats47 favicon concepts

Comparison-only concepts. These files do not replace the production favicon.

| ID | Name | Intent |
|---|---|---|
| A | Rising bars | Simplify the current bar-chart mark while retaining continuity |
| B | 47 monogram | Maximize recognition of the product name at small sizes |
| C | Japan chart | Combine the Japanese archipelago rhythm with a statistical chart |
| D | Prefecture grid | Express comparison across regions with one highlighted observation |

Shared constraints:

- `64 × 64` square SVG
- brand blue `#2563EB`, ink `#0F172A`, white background
- no gradients, shadows, fine text, or rounded app-tile container
- designed to remain legible at 16 px and 32 px

Before production adoption, render the selected concept at 16/32/48/180/192/512 px and generate `favicon.ico`, Apple touch icon, and maskable PWA variants with appropriate safe-area padding.

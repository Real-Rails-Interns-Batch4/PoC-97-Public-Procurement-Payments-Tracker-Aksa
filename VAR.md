# Visual Assurance Report (VAR) - PoC ID: 97

This report highlights the design system, color palettes, charting layouts, and mobile-responsive behaviors implemented to create the **Public Procurement Payments Tracker**.

---

## 🎨 Theme & Palette System

The dashboard implements a **Cinematic Dark Theme** matching modern analytics dashboards (e.g., Vercel, Datadog) to focus user attention on anomalies and hotspots.

- **Primary Background**: `#0B0F19` (Vivid deep navy-black).
- **Secondary Containers**: `#0F131E`/80 with a `backdrop-blur-md` filter, providing a clean glassmorphism style.
- **Accents & Status Colors**:
  - `Indigo` (`#6366F1`): Represents structural elements, awards, and default information guides.
  - `Emerald` (`#10B981`): Signals completed payments, on-time schedules, and high performance.
  - `Amber` (`#F59E0B`): Highlights mild warning states, pending milestones, and moderate delays (20–35 days).
  - `Rose` (`#EF4444`): Emphasizes critical blockages, disputes, and severe delays (>35 days).

---

## ⚡ Charts & Visual Components (Apache ECharts)

1. **Flow Diagram (Sankey)**:
   - Dynamic curveness values set to `0.5`.
   - Translucent gradient link colors bridging corresponding source/target nodes.
   - Node-level status coloring corresponding to the color system (e.g., Red for `Payment: Delayed`).
2. **Heatmap Grid**:
   - Auto-wrapping labels for long Agency names.
   - Continuous visual mapping allowing rapid visual identification of DoD IT Time & Materials contract delays.
3. **Timeline Line Chart**:
   - Dual-axis display allowing comparative charting between transaction volumes (subtle emerald bars) and processing duration trends (indigo/rose lines).
4. **Performance Leaderboards**:
   - Custom progress indicators showcasing relative delay levels.

---

## 📱 Responsiveness & Adaptability

The layout uses **Tailwind CSS Flex and CSS Grid** to resize across devices:
- **KPI Metrics**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (Wraps seamlessly on tablet and mobile screens).
- **Chart Grids**: Side-by-side on large desktop resolutions, shifting to single-column blocks on mobile screens.
- **Filters Toolbar**: Dynamic grid structure formatting dropdowns neatly on small displays, allowing ease of use for touch gestures.
- **Ledger Table**: Implements overflow-x scrolling to preserve structural columns on mobile viewports.

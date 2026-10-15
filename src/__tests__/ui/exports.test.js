import { describe, it, expect } from 'vitest';
import * as UI from '../../components/ui';

describe('UI Library exports (src/components/ui/index.js)', () => {
  it('should export all Part 1 primitive components', () => {
    expect(UI.Card).toBeDefined();
    expect(UI.Card.Header).toBeDefined();
    expect(UI.Card.Body).toBeDefined();
    expect(UI.Button).toBeDefined();
    expect(UI.IconButton).toBeDefined();
    expect(UI.Chip).toBeDefined();
    expect(UI.Badge).toBeDefined();
    expect(UI.Input).toBeDefined();
    expect(UI.SearchInput).toBeDefined();
    expect(UI.Select).toBeDefined();
  });

  it('should export all Part 2 navigation and indicator components', () => {
    expect(UI.Tabs).toBeDefined();
    expect(UI.SegmentedControl).toBeDefined();
    expect(UI.KpiCard).toBeDefined();
    expect(UI.AnimatedNumber).toBeDefined();
    expect(UI.SectionHeader).toBeDefined();
    expect(UI.PageHeader).toBeDefined();
    expect(UI.Skeleton).toBeDefined();
    expect(UI.KpiSkeleton).toBeDefined();
    expect(UI.ListRowSkeleton).toBeDefined();
    expect(UI.ChartSkeleton).toBeDefined();
    expect(UI.EmptyState).toBeDefined();
    expect(UI.ProgressBar).toBeDefined();
  });

  it('should export all Part 3 overlay and notification components', () => {
    expect(UI.Tooltip).toBeDefined();
    expect(UI.Dialog).toBeDefined();
    expect(UI.Drawer).toBeDefined();
    expect(UI.Dropdown).toBeDefined();
    expect(UI.ToastProvider).toBeDefined();
    expect(UI.useToast).toBeDefined();
  });
});

// Parameter schema: triggers
// ---------- triggers ----------
D.trigger.DeathTrigger = { label: 'On death', params: [] };
D.trigger.LifeTrigger = { label: 'By remaining life', params: [n('lowerBound', 'From (s left)', 0, 0, 10, 0.01), n('upperBound', 'To (s left)', 0.5, 0, 10, 0.01), b('triggerWithinBounds', 'Inside range', true)] };
D.trigger.ZoneTrigger = { label: 'Inside zone', params: [zs('zones', 'Zones', ['RectZone'])] };

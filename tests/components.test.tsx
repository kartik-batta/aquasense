// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import App from '../src/App';
import { Dialog } from '../src/components/Dialog';
import { PersonaSwitcher } from '../src/components/PersonaSwitcher';
import { GisFieldGrid } from '../src/components/GisFieldGrid';
import { FormattedMarkdown } from '../src/components/CopilotDrawer';
import { PRESET_SCENARIOS } from '../src/utils/scenarios';
import { runCompleteSimulation } from '../src/utils/simulationEngine';
import { stripMarkdown, speechLocale } from '../src/utils/speech';

beforeAll(() => {
  // jsdom lacks these browser APIs.
  Element.prototype.scrollIntoView = vi.fn();
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as HTMLCanvasElement['getContext'];
});

describe('Dialog', () => {
  function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
    return (
      <>
        <button>outside</button>
        <Dialog isOpen onClose={onClose} labelledBy="dlg-title">
          <h2 id="dlg-title">Title</h2>
          <button>first</button>
          <button>last</button>
        </Dialog>
      </>
    );
  }

  it('exposes an accessible modal dialog named by its heading', () => {
    render(<Harness />);
    const dialog = screen.getByRole('dialog', { name: 'Title' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('moves focus inside and traps Tab within the dialog', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByText('first')).toHaveFocus();
    await user.tab();
    expect(screen.getByText('last')).toHaveFocus();
    await user.tab();
    expect(screen.getByText('first')).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByText('last')).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders nothing when closed', () => {
    render(
      <Dialog isOpen={false} onClose={vi.fn()} labelledBy="x">
        hidden
      </Dialog>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('PersonaSwitcher', () => {
  it('marks the active persona with aria-pressed and reports changes', async () => {
    const setPersona = vi.fn();
    render(<PersonaSwitcher persona="agronomist" setPersona={setPersona} language="en" />);
    expect(screen.getByRole('button', { name: 'Agronomist' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Executive' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Farmer Coop' }));
    expect(setPersona).toHaveBeenCalledWith('farmer_coop');
  });
});

describe('GisFieldGrid', () => {
  it('lets keyboard users select a zone with Enter and Space', () => {
    const scenario = PRESET_SCENARIOS[0];
    const onSelectZone = vi.fn();
    render(
      <GisFieldGrid
        zones={scenario.zones}
        simulation={runCompleteSimulation(scenario)}
        selectedZoneId={scenario.zones[0].id}
        onSelectZone={onSelectZone}
        language="en"
      />
    );
    const card = screen.getByRole('button', { name: /Unit B: Lowland Basmati Rice/ });
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    expect(onSelectZone).toHaveBeenNthCalledWith(1, 'zone_b');
    expect(onSelectZone).toHaveBeenNthCalledWith(2, 'zone_b');
  });
});

describe('App', () => {
  it('has no automatically detectable WCAG A/AA violations in any persona view', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    for (const persona of ['Executive', 'Agronomist', 'Farmer Coop']) {
      await user.click(within(screen.getByRole('banner')).getByRole('button', { name: persona }));
      const results = await axe.run(container, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        // jsdom cannot compute rendered colours; contrast is covered by the design tokens.
        rules: { 'color-contrast': { enabled: false } },
      });
      expect(results.violations.map(v => `${persona}: ${v.id} – ${v.help}`)).toEqual([]);
    }
  });

  it('keeps the document language in sync with the selected language', async () => {
    render(<App />);
    await userEvent.selectOptions(screen.getByLabelText('Select language'), 'hi');
    expect(document.documentElement.lang).toBe('hi');
  });

  it('opens the copilot as a dialog and returns focus on close', async () => {
    const user = userEvent.setup();
    render(<App />);
    const fab = screen.getByRole('button', { name: 'Grounded Copilot' });
    await user.click(fab);
    expect(screen.getByRole('dialog', { name: 'AquaSense Grounded Copilot' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fab).toHaveFocus();
  });

  it('sends a voice-assistant question straight to the copilot', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true, text: 'answer text', grounded: true, source: 'test' })));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Voice Briefing' }));
    const voiceDialog = screen.getByRole('dialog', { name: /Voice Assistant/ });
    // Sample question names the zones the simulation actually chose.
    await user.click(within(voiceDialog).getByRole('button', { name: /Unit D: Riverfront Export Cotton over Unit A/ }));

    expect(await screen.findByText('answer text')).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string).prompt).toMatch(/Unit D: Riverfront Export Cotton over Unit A/);
    vi.unstubAllGlobals();
  });
});

describe('FormattedMarkdown', () => {
  it('renders bold-only lines as bold text, not as italic audit notes', () => {
    const { container } = render(<FormattedMarkdown content={'**3. Simulated Impact:**\n\n*Audit Note: synthetic data*'} />);
    expect(screen.getByText('3. Simulated Impact:').tagName).toBe('STRONG');
    expect(container.querySelector('.italic')).toHaveTextContent('Audit Note: synthetic data');
    expect(container.querySelectorAll('.italic')).toHaveLength(1);
  });

  it('converts LaTeX fragments into readable symbols', () => {
    render(<FormattedMarkdown content={'Budget $W = 3400 \\text{ kL}$ with \\sigma'} />);
    expect(screen.getByText(/Budget W = 3400 kL with σ/)).toBeInTheDocument();
  });
});

describe('speech helpers', () => {
  it('maps languages to speech locales', () => {
    expect(speechLocale('hi')).toBe('hi-IN');
    expect(speechLocale('sw')).toBe('sw-KE');
  });

  it('strips markdown before text-to-speech', () => {
    expect(stripMarkdown('### Title\n\n- **Bold** and `code`')).toBe('Title\nBold and code');
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultimodalVisionWidget } from '../src/components/MultimodalVisionWidget';
import { PersonaViewExecutive } from '../src/components/PersonaViewExecutive';
import { ScenarioSandbox } from '../src/components/ScenarioSandbox';
import { VoiceAssistantModal } from '../src/components/VoiceAssistantModal';
import { PRESET_SCENARIOS, generateRandomScenario } from '../src/utils/scenarios';
import { runCompleteSimulation } from '../src/utils/simulationEngine';

const scenario = PRESET_SCENARIOS[0];
const simulation = runCompleteSimulation(scenario);

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as HTMLCanvasElement['getContext'];
});

describe('MultimodalVisionWidget', () => {
  it('injects NDVI stress into the selected zone and announces it', async () => {
    const onUpdate = vi.fn();
    render(<MultimodalVisionWidget selectedZone={scenario.zones[0]} onUpdateZoneWithNdvi={onUpdate} language="en" />);

    await userEvent.click(screen.getByRole('button', { name: 'Severe Stress' }));
    expect(screen.getByRole('button', { name: 'Severe Stress' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Inject NDVI Stress/ }));

    expect(onUpdate).toHaveBeenCalledWith('zone_a', 0.32, 45);
    expect(screen.getByRole('status')).toHaveTextContent('Zone prior updated');
  });

  it('rejects unsupported or oversized uploads with an accessible error', () => {
    render(<MultimodalVisionWidget selectedZone={scenario.zones[0]} onUpdateZoneWithNdvi={vi.fn()} language="en" />);
    const input = screen.getByLabelText('Upload Drone Multispectral Image');
    fireEvent.change(input, { target: { files: [new File(['x'], 'evil.svg', { type: 'image/svg+xml' })] } });
    expect(screen.getByRole('alert')).toHaveTextContent('PNG, JPEG or WebP');
  });
});

describe('PersonaViewExecutive', () => {
  it('exports an audit log whose compliance figures come from the simulation', async () => {
    let exported: Blob | undefined;
    const createUrl = vi.fn((blob: Blob) => {
      exported = blob;
      return 'blob:audit';
    });
    const revokeUrl = vi.fn();
    Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<PersonaViewExecutive scenario={scenario} simulation={simulation} language="en" />);
    await userEvent.click(screen.getByRole('button', { name: /Export/ }));

    expect(clickSpy).toHaveBeenCalled();
    expect(revokeUrl).toHaveBeenCalledWith('blob:audit');
    const audit = JSON.parse(await exported!.text());
    expect(audit.complianceCertification.budgetComplianceScore).toBe(
      `${simulation.voiSensing.budgetCompliancePct.toFixed(1)}%`
    );
    expect(audit.complianceCertification.hardBudgetOverdraftViolation_kL).toBe(0);
    clickSpy.mockRestore();
  });
});

describe('ScenarioSandbox', () => {
  it('applies the chosen budget and sensor quota', async () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(<ScenarioSandbox isOpen onClose={onClose} scenario={scenario} onApplySandbox={onApply} language="en" />);

    fireEvent.change(screen.getByLabelText(/Total Basin Water Budget/), { target: { value: '2500' } });
    await userEvent.click(screen.getByRole('button', { name: 'K = 3' }));
    expect(screen.getByRole('button', { name: 'K = 3' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Apply/ }));

    expect(onApply).toHaveBeenCalledWith(2500, 3);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('VoiceAssistantModal', () => {
  it('explains when speech recognition is unavailable', async () => {
    render(
      <VoiceAssistantModal
        isOpen
        onClose={vi.fn()}
        scenario={scenario}
        simulation={simulation}
        language="en"
        onExecutePrompt={vi.fn()}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Start voice input' }));
    expect(screen.getByRole('status')).toHaveTextContent('not supported');
  });
});

describe('generateRandomScenario', () => {
  it('keeps the requested budgets and produces valid zones', () => {
    const random = generateRandomScenario(2800, 2);
    expect(random.totalWaterBudget).toBe(2800);
    expect(random.sensorBudget).toBe(2);
    expect(random.zones).toHaveLength(scenario.zones.length);
    random.zones.forEach(z => {
      expect(z.estimated_water_need_mean).toBeGreaterThanOrEqual(200);
      expect(z.estimated_water_need_std).toBeGreaterThanOrEqual(30);
      expect(z.hidden_ground_truth_need).toBeGreaterThan(0);
    });
  });
});

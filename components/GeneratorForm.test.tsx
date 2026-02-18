import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneratorForm } from './GeneratorForm';
import { GenerationSettings } from '../types';

const defaultSettings: GenerationSettings = {
  rarity: 'Rare',
  type: 'Wondrous Item',
  theme: 'Ancient Civilization',
  style: 'Oil Painting',
  powerBand: 'Standard',
  includeCurse: false,
  includePlotHook: true,
  customPrompt: '',
};

describe('GeneratorForm', () => {
  let onSettingsChange: ReturnType<typeof vi.fn>;
  let onGenerate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSettingsChange = vi.fn();
    onGenerate = vi.fn();
  });

  const renderForm = (overrides?: Partial<GenerationSettings>, isGenerating = false) =>
    render(
      <GeneratorForm
        settings={{ ...defaultSettings, ...overrides }}
        onSettingsChange={onSettingsChange}
        onGenerate={onGenerate}
        isGenerating={isGenerating}
      />
    );

  it('renders the main form labels', () => {
    renderForm();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Rarity')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Art Style')).toBeInTheDocument();
    expect(screen.getByText('Resonance Level')).toBeInTheDocument();
  });

  it('renders selects with current setting values', () => {
    renderForm();
    expect(screen.getByDisplayValue('Wondrous Item')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rare')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ancient Civilization')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Oil Painting')).toBeInTheDocument();
  });

  it('calls onSettingsChange with updated rarity', () => {
    renderForm();
    fireEvent.change(screen.getByDisplayValue('Rare'), { target: { value: 'Legendary' } });
    expect(onSettingsChange).toHaveBeenCalledWith({ ...defaultSettings, rarity: 'Legendary' });
  });

  it('calls onSettingsChange with updated theme', () => {
    renderForm();
    fireEvent.change(screen.getByDisplayValue('Ancient Civilization'), { target: { value: 'Infernal' } });
    expect(onSettingsChange).toHaveBeenCalledWith({ ...defaultSettings, theme: 'Infernal' });
  });

  it('calls onSettingsChange with updated art style', () => {
    renderForm();
    fireEvent.change(screen.getByDisplayValue('Oil Painting'), { target: { value: 'Watercolor' } });
    expect(onSettingsChange).toHaveBeenCalledWith({ ...defaultSettings, style: 'Watercolor' });
  });

  it('calls onSettingsChange when a power band is clicked', () => {
    renderForm();
    // Power band labels are truncated to the first word: 'Low', 'Standard', 'High', 'Mythic'
    fireEvent.click(screen.getByText('Mythic'));
    expect(onSettingsChange).toHaveBeenCalledWith({ ...defaultSettings, powerBand: 'Mythic' });
  });

  it('calls onSettingsChange when curse toggle is clicked', () => {
    renderForm();
    fireEvent.click(screen.getByText(/incantation: curse/i));
    expect(onSettingsChange).toHaveBeenCalledWith({ ...defaultSettings, includeCurse: true });
  });

  it('calls onSettingsChange when plot hook toggle is clicked', () => {
    renderForm();
    fireEvent.click(screen.getByText(/weave: plot hook/i));
    expect(onSettingsChange).toHaveBeenCalledWith({ ...defaultSettings, includePlotHook: false });
  });

  it('calls onSettingsChange when lore seed changes', () => {
    renderForm();
    const textarea = screen.getByPlaceholderText(/a blade forged/i);
    fireEvent.change(textarea, { target: { value: 'A ring worn by a lich' } });
    expect(onSettingsChange).toHaveBeenCalledWith({
      ...defaultSettings,
      customPrompt: 'A ring worn by a lich',
    });
  });

  it('caps the lore seed at 300 characters', () => {
    renderForm();
    const textarea = screen.getByPlaceholderText(/a blade forged/i);
    const longInput = 'x'.repeat(350);
    fireEvent.change(textarea, { target: { value: longInput } });
    expect(onSettingsChange).toHaveBeenCalledWith({
      ...defaultSettings,
      customPrompt: 'x'.repeat(300),
    });
  });

  it('shows 0/300 when lore seed is empty', () => {
    renderForm();
    expect(screen.getByText('0/300')).toBeInTheDocument();
  });

  it('displays the correct lore seed character count', () => {
    renderForm({ customPrompt: 'hello' });
    expect(screen.getByText('5/300')).toBeInTheDocument();
  });

  it('calls onGenerate when "Strike Anvil" is clicked', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: /strike anvil/i }));
    expect(onGenerate).toHaveBeenCalledOnce();
  });

  it('disables the generate button and shows loading state while generating', () => {
    renderForm({}, true);
    expect(screen.getByRole('button', { name: /conjuring/i })).toBeDisabled();
    expect(screen.getByText('Conjuring...')).toBeInTheDocument();
  });
});

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import SpeechBubble from '../SpeechBubble';

describe('SpeechBubble', () => {
  it('renders the supportive message text passed to it', () => {
    render(<SpeechBubble message="You are not broken." />);

    // The message should be rendered into the DOM as a paragraph.
    expect(screen.getByText('You are not broken.')).toBeInTheDocument();
  });

  it('applies the speech-bubble class to its container', () => {
    const { container } = render(
      <SpeechBubble message="Healing is not linear." position="top" />
    );

    expect(container.querySelector('.speech-bubble')).not.toBeNull();
  });
});
